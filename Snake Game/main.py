import pygame
import random
import os
import numpy as np

# Suppress TF logs for cleaner game output
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3' 
import tensorflow as tf

# --- Configuration & Initialization ---
pygame.init()

# Constants
WIDTH, HEIGHT = 800, 600
BLOCK_SIZE = 40
FPS = 20 # Speed up for AI

# Colors
WHITE = (255, 255, 255)
GRID_COLOR = (50, 50, 50) 
SCORE_COLOR = (255, 215, 0)
ANIM_COLOR = (0, 255, 0) 

# Screen setup
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Snake Project: Human vs AI")
clock = pygame.time.Clock()
font_main = pygame.font.SysFont("Arial", 32, bold=True)
font_score = pygame.font.SysFont("Consolas", 28, bold=True)

# --- Path Setup ---
BASE_PATH = r"D:\Deep Learning Projects\Snake Game" # Update this if needed

# --- AI MODEL LOADING ---
try:
    model_path = os.path.join(os.getcwd(), 'snake_model.h5')
    AI_MODEL = tf.keras.models.load_model(model_path)
    print("AI Model Loaded Successfully.")
except:
    print("WARNING: 'snake_model.h5' not found. Run train_snake.py first!")
    AI_MODEL = None

def load_img(name, size=(BLOCK_SIZE, BLOCK_SIZE)):
    path = os.path.join(BASE_PATH, name)
    try:
        img = pygame.image.load(path).convert_alpha()
        return pygame.transform.scale(img, size)
    except:
        surf = pygame.Surface(size)
        surf.fill((200, 0, 0))
        return surf

# Load Assets
try:
    bg_img = pygame.image.load(os.path.join(BASE_PATH, "game_background.png")).convert()
    bg_img = pygame.transform.scale(bg_img, (WIDTH, HEIGHT))
except:
    bg_img = pygame.Surface((WIDTH, HEIGHT))
    bg_img.fill((0,0,0))

head_img = load_img("snake_head_left_removebg.png")
body_even = load_img("snake_body_square_even.png")
body_odd = load_img("snake_body_square_odd.png")
food_img = load_img("snake_food_removebg.png")

# --- Helper Functions ---
def draw_grid():
    for x in range(0, WIDTH, BLOCK_SIZE):
        pygame.draw.line(screen, GRID_COLOR, (x, 0), (x, HEIGHT))
    for y in range(0, HEIGHT, BLOCK_SIZE):
        pygame.draw.line(screen, GRID_COLOR, (0, y), (WIDTH, y))

def get_state_for_ai(snake, food):
    # MUST MATCH THE TRAINING DATA LOGIC EXACTLY
    head = snake[0]
    
    food_dx = (food[0] - head[0]) / WIDTH
    food_dy = (food[1] - head[1]) / HEIGHT

    pt = [head[0], head[1] - BLOCK_SIZE]
    blocked_u = 1 if pt[1] < 0 or pt in snake else 0
    
    pt = [head[0], head[1] + BLOCK_SIZE]
    blocked_d = 1 if pt[1] >= HEIGHT or pt in snake else 0

    pt = [head[0] - BLOCK_SIZE, head[1]]
    blocked_l = 1 if pt[0] < 0 or pt in snake else 0

    pt = [head[0] + BLOCK_SIZE, head[1]]
    blocked_r = 1 if pt[0] >= WIDTH or pt in snake else 0

    return np.array([[food_dx, food_dy, blocked_u, blocked_d, blocked_l, blocked_r]])

class ScoreManager:
    def __init__(self):
        self.score = 0
        self.plus_one_timer = 0
        self.plus_one_pos = [0, 0]

    def add_score(self, pos):
        self.score += 1
        self.plus_one_timer = 15 
        self.plus_one_pos = [pos[0], pos[1] - 20]

    def draw(self):
        screen.blit(food_img, (20, 20))
        score_txt = font_score.render(f": {self.score}", True, WHITE)
        screen.blit(score_txt, (65, 25))

        if self.plus_one_timer > 0:
            anim_txt = font_score.render("+1", True, ANIM_COLOR)
            screen.blit(anim_txt, (self.plus_one_pos[0], self.plus_one_pos[1]))
            self.plus_one_pos[1] -= 2 
            self.plus_one_timer -= 1

# --- Main Game Loop ---
def run_game(mode="HUMAN"):
    snake_pos = [[400, 320], [360, 320], [320, 320]]
    direction = "RIGHT"
    food_pos = [random.randrange(0, WIDTH//BLOCK_SIZE) * BLOCK_SIZE,
                random.randrange(0, HEIGHT//BLOCK_SIZE) * BLOCK_SIZE]
    
    score_manager = ScoreManager()
    running = True

    while running:
        screen.blit(bg_img, (0, 0))
        draw_grid()

        # 1. Input / AI Logic
        for event in pygame.event.get():
            if event.type == pygame.QUIT: return
            
        if mode == "HUMAN":
            keys = pygame.key.get_pressed()
            if keys[pygame.K_UP] and direction != "DOWN": direction = "UP"
            if keys[pygame.K_DOWN] and direction != "UP": direction = "DOWN"
            if keys[pygame.K_LEFT] and direction != "RIGHT": direction = "LEFT"
            if keys[pygame.K_RIGHT] and direction != "LEFT": direction = "RIGHT"
        else:
            # --- AI IMPLEMENTATION ---
            if AI_MODEL:
                state = get_state_for_ai(snake_pos, food_pos)
                prediction = AI_MODEL.predict(state, verbose=0)
                move_idx = np.argmax(prediction) # 0: UP, 1: DOWN, 2: LEFT, 3: RIGHT
                
                # Convert Index to String Direction
                new_dir = ["UP", "DOWN", "LEFT", "RIGHT"][move_idx]
                
                # Basic Safety Check: Don't let AI do a 180 instant death turn
                opposites = {"UP": "DOWN", "DOWN": "UP", "LEFT": "RIGHT", "RIGHT": "LEFT"}
                if new_dir != opposites.get(direction):
                    direction = new_dir
            else:
                pass # AI Model missing

        # 2. Movement
        new_head = list(snake_pos[0])
        if direction == "UP":    new_head[1] -= BLOCK_SIZE
        if direction == "DOWN":  new_head[1] += BLOCK_SIZE
        if direction == "LEFT":  new_head[0] -= BLOCK_SIZE
        if direction == "RIGHT": new_head[0] += BLOCK_SIZE
        snake_pos.insert(0, new_head)

        # 3. Collision / Eating
        if snake_pos[0] == food_pos:
            score_manager.add_score(food_pos)
            food_pos = [random.randrange(0, WIDTH//BLOCK_SIZE) * BLOCK_SIZE,
                        random.randrange(0, HEIGHT//BLOCK_SIZE) * BLOCK_SIZE]
            # Ensure food doesn't spawn on snake
            while food_pos in snake_pos:
                food_pos = [random.randrange(0, WIDTH//BLOCK_SIZE) * BLOCK_SIZE,
                            random.randrange(0, HEIGHT//BLOCK_SIZE) * BLOCK_SIZE]
        else:
            snake_pos.pop()

        # 4. Draw Assets
        screen.blit(food_img, (food_pos[0], food_pos[1]))
        for i, pos in enumerate(snake_pos):
            if i == 0:
                # Head Rotation
                rot_map = {"UP":270, "DOWN":90, "LEFT":0, "RIGHT":180}
                rot = rot_map.get(direction, 0)
                screen.blit(pygame.transform.rotate(head_img, rot), (pos[0], pos[1]))
            else:
                img = body_even if i % 2 == 0 else body_odd
                screen.blit(img, (pos[0], pos[1]))

        # 5. UI and Death
        score_manager.draw()
        if (snake_pos[0][0] < 0 or snake_pos[0][0] >= WIDTH or 
            snake_pos[0][1] < 0 or snake_pos[0][1] >= HEIGHT or
            snake_pos[0] in snake_pos[1:]):
            print(f"Game Over! Final Score: {score_manager.score}")
            running = False

        pygame.display.update()
        clock.tick(FPS)

# --- Menu ---
def main_menu():
    while True:
        screen.fill((20, 20, 20))
        title = font_main.render("SNAKE PROJECT", True, WHITE)
        btn1 = font_main.render("1. Play Myself (Mouse/Keyboard)", True, (100, 255, 100))
        btn2 = font_main.render("2. AI Mode (Neural Network)", True, (100, 100, 255))
        btn3 = font_main.render("3. Exit", True, (255, 100, 100))

        screen.blit(title, (WIDTH//2 - 100, 100))
        screen.blit(btn1, (WIDTH//2 - 200, 250))
        screen.blit(btn2, (WIDTH//2 - 200, 320))
        screen.blit(btn3, (WIDTH//2 - 200, 390))

        pygame.display.update()

        for event in pygame.event.get():
            if event.type == pygame.QUIT: return
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_1: run_game("HUMAN")
                if event.key == pygame.K_2: run_game("AI")
                if event.key == pygame.K_3: pygame.quit(); exit()
            if event.type == pygame.MOUSEBUTTONDOWN:
                mx, my = pygame.mouse.get_pos()
                if 250 < my < 300: run_game("HUMAN")
                if 320 < my < 370: run_game("AI")
                if 390 < my < 440: pygame.quit(); exit()

if __name__ == "__main__":
    main_menu()