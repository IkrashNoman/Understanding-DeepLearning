import pygame
import random
import os

# --- Configuration & Initialization ---
pygame.init()

# Constants
WIDTH, HEIGHT = 800, 600
BLOCK_SIZE = 40  # Set to match your image sizes (approx)
FPS = 10         # Adjust this to fix the "too fast" issue

# Screen setup
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Deep Learning Snake Game")
clock = pygame.time.Clock()

# --- Path Setup ---
BASE_PATH = r"D:\Deep Learning Projects\Snake Game"

def load_img(name, size=(BLOCK_SIZE, BLOCK_SIZE)):
    path = os.path.join(BASE_PATH, name)
    img = pygame.image.load(path).convert_alpha()
    return pygame.transform.scale(img, size)

# Load Assets
try:
    # Background - scaled to fill the screen
    bg_img = pygame.image.load(os.path.join(BASE_PATH, "game_background.png")).convert()
    bg_img = pygame.transform.scale(bg_img, (WIDTH, HEIGHT))
    
    # Snake & Food
    head_img = load_img("snake_head_left_removebg.png")
    body_even = load_img("snake_body_square_even.png")
    body_odd = load_img("snake_body_square_odd.png")
    food_img = load_img("snake_food_removebg.png")
except Exception as e:
    print(f"Error loading images: {e}. Check your file names!")
    pygame.quit()
    exit()

# --- Game Logic ---
def run_game():
    # Snake starts in the middle
    snake_pos = [[400, 300], [360, 300], [320, 300]]
    direction = "RIGHT"
    
    # Food setup
    food_pos = [random.randrange(1, (WIDTH//BLOCK_SIZE)) * BLOCK_SIZE,
                random.randrange(1, (HEIGHT//BLOCK_SIZE)) * BLOCK_SIZE]
    
    running = True
    while running:
        # 1. Background (Fixed: showing first)
        screen.blit(bg_img, (0, 0))

        # 2. Input Handling
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_UP and direction != "DOWN": direction = "UP"
                if event.key == pygame.K_DOWN and direction != "UP": direction = "DOWN"
                if event.key == pygame.K_LEFT and direction != "RIGHT": direction = "LEFT"
                if event.key == pygame.K_RIGHT and direction != "LEFT": direction = "RIGHT"

        # 3. Move Snake
        new_head = list(snake_pos[0])
        if direction == "UP":    new_head[1] -= BLOCK_SIZE
        if direction == "DOWN":  new_head[1] += BLOCK_SIZE
        if direction == "LEFT":  new_head[0] -= BLOCK_SIZE
        if direction == "RIGHT": new_head[0] += BLOCK_SIZE
        
        snake_pos.insert(0, new_head)

        # 4. Eating Food Logic (Fixed)
        # Using a small tolerance (buffer) to ensure collision detection works
        if abs(snake_pos[0][0] - food_pos[0]) < BLOCK_SIZE and abs(snake_pos[0][1] - food_pos[1]) < BLOCK_SIZE:
            food_pos = [random.randrange(1, (WIDTH//BLOCK_SIZE)) * BLOCK_SIZE,
                        random.randrange(1, (HEIGHT//BLOCK_SIZE)) * BLOCK_SIZE]
        else:
            snake_pos.pop()

        # 5. Draw Food
        screen.blit(food_img, (food_pos[0], food_pos[1]))

        # 6. Draw Snake (Fixed: even/odd logic)
        for i, pos in enumerate(snake_pos):
            if i == 0:
                # Rotate head based on direction
                rot_head = head_img
                if direction == "UP":    rot_head = pygame.transform.rotate(head_img, 270)
                if direction == "DOWN":  rot_head = pygame.transform.rotate(head_img, 90)
                if direction == "RIGHT": rot_head = pygame.transform.rotate(head_img, 180)
                screen.blit(rot_head, (pos[0], pos[1]))
            else:
                # Alternate body images
                img = body_even if i % 2 == 0 else body_odd
                screen.blit(img, (pos[0], pos[1]))

        # 7. Check Collisions (Walls/Self)
        if (snake_pos[0][0] < 0 or snake_pos[0][0] >= WIDTH or 
            snake_pos[0][1] < 0 or snake_pos[0][1] >= HEIGHT or
            snake_pos[0] in snake_pos[1:]):
            running = False

        pygame.display.update()
        
        # 8. Speed Control (Fixed: too much speed)
        clock.tick(FPS)

    pygame.quit()

if __name__ == "__main__":
    run_game()