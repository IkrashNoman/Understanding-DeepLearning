import pygame
import random
import numpy as np
import tensorflow as  tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense
from tensorflow.keras.optimizers import Adam
import os

# --- Configuration ---
WIDTH, HEIGHT = 800, 600
BLOCK_SIZE = 40
GAMES_TO_PLAY = 2000  # Number of games to simulate for the dataset

# Direction Encodings
# 0: UP, 1: DOWN, 2: LEFT, 3: RIGHT
DIRS = [0, 1, 2, 3]

def get_state(snake, food):
    """
    Extracts a feature vector (Input Layer) from the game state.
    We normalize values to help the ANN converge.
    Vector: [Food_X_Diff, Food_Y_Diff, Blocked_UP, Blocked_DOWN, Blocked_LEFT, Blocked_RIGHT]
    """
    head = snake[0]
    
    # Normalized distance to food
    food_dx = (food[0] - head[0]) / WIDTH
    food_dy = (food[1] - head[1]) / HEIGHT

    # Check immediate danger (1 if blocked, 0 if safe)
    # Check UP
    pt = [head[0], head[1] - BLOCK_SIZE]
    blocked_u = 1 if pt[1] < 0 or pt in snake else 0
    
    # Check DOWN
    pt = [head[0], head[1] + BLOCK_SIZE]
    blocked_d = 1 if pt[1] >= HEIGHT or pt in snake else 0

    # Check LEFT
    pt = [head[0] - BLOCK_SIZE, head[1]]
    blocked_l = 1 if pt[0] < 0 or pt in snake else 0

    # Check RIGHT
    pt = [head[0] + BLOCK_SIZE, head[1]]
    blocked_r = 1 if pt[0] >= WIDTH or pt in snake else 0

    return np.array([food_dx, food_dy, blocked_u, blocked_d, blocked_l, blocked_r])

def suggest_move(snake, food):
    """
    The 'Teacher' Algorithm. 
    Simple Heuristic: Try to reduce distance to food. If blocked, try any safe move.
    """
    head = snake[0]
    possible_moves = []

    # 0: UP, 1: DOWN, 2: LEFT, 3: RIGHT
    
    # Prioritize moves that get closer to food
    if food[0] < head[0]: possible_moves.append(2) # Left
    if food[0] > head[0]: possible_moves.append(3) # Right
    if food[1] < head[1]: possible_moves.append(0) # Up
    if food[1] > head[1]: possible_moves.append(1) # Down

    # Add remaining moves as backup
    for d in DIRS:
        if d not in possible_moves:
            possible_moves.append(d)

    # Filter out suicidal moves
    safe_moves = []
    for move in possible_moves:
        test_head = list(head)
        if move == 0: test_head[1] -= BLOCK_SIZE
        if move == 1: test_head[1] += BLOCK_SIZE
        if move == 2: test_head[0] -= BLOCK_SIZE
        if move == 3: test_head[0] += BLOCK_SIZE

        # Collision Check
        if (test_head[0] < 0 or test_head[0] >= WIDTH or
            test_head[1] < 0 or test_head[1] >= HEIGHT or
            test_head in snake):
            continue # This move kills us
        
        safe_moves.append(move)

    # If we have safe moves that approach food, pick the first one.
    # Otherwise pick any safe move.
    if safe_moves:
        return safe_moves[0]
    else:
        return random.choice(DIRS) # Death is inevitable

def generate_dataset():
    print(f"Generating Dataset from {GAMES_TO_PLAY} games...")
    X = [] # Inputs
    y = [] # Targets (Correct Moves)

    for i in range(GAMES_TO_PLAY):
        snake = [[400, 320], [360, 320], [320, 320]]
        food = [random.randrange(0, WIDTH//BLOCK_SIZE) * BLOCK_SIZE,
                random.randrange(0, HEIGHT//BLOCK_SIZE) * BLOCK_SIZE]
        
        while True:
            # 1. Observe State
            current_state = get_state(snake, food)
            
            # 2. Ask Teacher for the move
            action = suggest_move(snake, food)
            
            # 3. Record Data
            X.append(current_state)
            
            # One-hot encode output (e.g., UP becomes [1, 0, 0, 0])
            target = np.zeros(4)
            target[action] = 1
            y.append(target)

            # 4. Execute Move (Simulation)
            new_head = list(snake[0])
            if action == 0: new_head[1] -= BLOCK_SIZE
            if action == 1: new_head[1] += BLOCK_SIZE
            if action == 2: new_head[0] -= BLOCK_SIZE
            if action == 3: new_head[0] += BLOCK_SIZE
            
            snake.insert(0, new_head)

            # Eating or Moving
            if snake[0] == food:
                food = [random.randrange(0, WIDTH//BLOCK_SIZE) * BLOCK_SIZE,
                        random.randrange(0, HEIGHT//BLOCK_SIZE) * BLOCK_SIZE]
            else:
                snake.pop()

            # Death Check
            if (snake[0][0] < 0 or snake[0][0] >= WIDTH or 
                snake[0][1] < 0 or snake[0][1] >= HEIGHT or
                snake[0] in snake[1:]):
                break
        
        if i % 500 == 0:
            print(f"Simulated {i} games...")

    return np.array(X), np.array(y)

def train_model():
    X, y = generate_dataset()
    print(f"Training on {len(X)} samples...")

    # Define ANN Architecture
    model = Sequential([
        Dense(128, input_shape=(6,), activation='relu'), # Input Layer (6 features)
        Dense(128, activation='relu'),                   # Hidden Layer
        Dense(4, activation='softmax')                   # Output Layer (Probabilities for Up, Down, Left, Right)
    ])

    model.compile(optimizer=Adam(learning_rate=0.001), loss='categorical_crossentropy', metrics=['accuracy'])
    
    # Train
    model.fit(X, y, epochs=5, batch_size=32, validation_split=0.2)
    
    # Save
    model.save('snake_model.h5')
    print("Model saved as 'snake_model.h5'")

if __name__ == "__main__":
    train_model()