console.time("Training Time");

// ===========================
// 1. MATH & ACTIVATIONS
// ===========================
function relu(x) {
    return Math.max(0, x);
}

function relu_deriv(x) {
    return x > 0 ? 1 : 0;
}

// SOFTMAX: The Key to Multi-Choice Decision Making
function softmax(arr) {
    const maxVal = Math.max(...arr);
    const exps = arr.map(x => Math.exp(x - maxVal));
    const sumExps = exps.reduce((a, b) => a + b, 0);
    return exps.map(x => x / sumExps);
}

// ===========================
// 2. NEURAL NETWORK
// ===========================
class NeuralNetwork {
    constructor() {
        // UPGRADE: Increased Hidden Layer from 64 to 128 neurons
        // This gives the AI more "brain cells" to understand messy boards.
        this.inputSize = 9;
        this.hiddenSize = 128; 
        this.outputSize = 9;

        // He Initialization
        this.w1 = Array.from({length: this.hiddenSize}, () => 
            Array.from({length: this.inputSize}, () => (Math.random() - 0.5) * 0.5) 
        );
        this.b1 = Array(this.hiddenSize).fill(0.0);
        
        this.w2 = Array.from({length: this.outputSize}, () => 
            Array.from({length: this.hiddenSize}, () => (Math.random() - 0.5) * 0.5) 
        );
        this.b2 = Array(this.outputSize).fill(0.0);

        // Momentum (Beta)
        this.beta = 0.9;
        this.v_w1 = this.createZeroMatrix(this.hiddenSize, this.inputSize);
        this.v_b1 = new Array(this.hiddenSize).fill(0);
        this.v_w2 = this.createZeroMatrix(this.outputSize, this.hiddenSize);
        this.v_b2 = new Array(this.outputSize).fill(0);
    }

    createZeroMatrix(rows, cols) {
        return Array.from({length: rows}, () => new Array(cols).fill(0));
    }

    forward(x) {
        // Layer 1
        this.z1 = [];
        for(let i=0; i<this.hiddenSize; i++) {
            let sum = this.b1[i];
            for(let j=0; j<this.inputSize; j++) {
                sum += this.w1[i][j] * x[j];
            }
            this.z1.push(sum);
        }
        this.a1 = this.z1.map(relu);
        
        // Layer 2
        this.z2 = []; 
        for(let i=0; i<this.outputSize; i++) {
             let sum = this.b2[i];
             for(let j=0; j<this.hiddenSize; j++) {
                 sum += this.w2[i][j] * this.a1[j];
             }
             this.z2.push(sum);
        }
        
        // Softmax Activation (Crucial for Classification)
        this.a2 = softmax(this.z2);
        return this.a2;
    }

    train(x, y, lr) {
        const out = this.forward(x);

        // Gradient: Softmax + CrossEntropy simplifies to (Output - Target)
        const dz2 = out.map((o, i) => o - y[i]);
    
        // Backprop Layer 1
        const dz1 = new Array(this.hiddenSize).fill(0);
        for(let i=0; i<this.hiddenSize; i++) {
            for(let j=0; j<this.outputSize; j++) {
                dz1[i] += dz2[j] * this.w2[j][i];
            }
            dz1[i] *= relu_deriv(this.z1[i]);
        }

        // Update Weights (Layer 2)
        for(let i=0; i<this.outputSize; i++) {
            for(let j=0; j<this.hiddenSize; j++) {
                const grad = dz2[i] * this.a1[j];
                this.v_w2[i][j] = (this.beta * this.v_w2[i][j]) + (lr * grad);
                this.w2[i][j] -= this.v_w2[i][j];
            }
            this.v_b2[i] = (this.beta * this.v_b2[i]) + (lr * dz2[i]);
            this.b2[i] -= this.v_b2[i];
        }

        // Update Weights (Layer 1)
        for(let i=0; i<this.hiddenSize; i++) {
            for(let j=0; j<this.inputSize; j++) {
                const grad = dz1[i] * x[j];
                this.v_w1[i][j] = (this.beta * this.v_w1[i][j]) + (lr * grad);
                this.w1[i][j] -= this.v_w1[i][j];
            }
            this.v_b1[i] = (this.beta * this.v_b1[i]) + (lr * dz1[i]);
            this.b1[i] -= this.v_b1[i];
        }
    }
}

// ===========================
// MAIN RUNNER
// ===========================
const fs = require('fs');

try {
    const raw = fs.readFileSync('data.json');
    const jsonData = JSON.parse(raw);
    // Use ONLY minimax data (Rule based is empty anyway)
    const data = jsonData.minimax; 

    console.log(`Loaded ${data.length} robust samples.`);
    const nn = new NeuralNetwork();

    // Adjusted LR for the new complex data
    const LEARNING_RATE = 0.002; 

    for (let epoch = 0; epoch <= 3000; epoch++) { 
        data.sort(() => Math.random() - 0.5); 

        for (const sample of data) {
            nn.train(sample.x, sample.y, LEARNING_RATE);
        }

        if (epoch % 100 === 0) {
            let correct = 0;
            for (const sample of data) {
                const out = nn.forward(sample.x);
                const predictedMove = out.indexOf(Math.max(...out));
                const actualMove = sample.y.indexOf(1);
                if (predictedMove === actualMove) correct++;
            }
            
            const acc = (correct / data.length * 100).toFixed(2);
            console.log(`Epoch ${epoch} | Accuracy: ${acc}%`);

            // Stop if we hit perfection (prevent over-training)
            if (acc > 99.5) {
                console.log("High accuracy reached! Stopping early.");
                break;
            }
        }
    }
    
    console.timeEnd("Training Time");

    // SAVE THE UPGRADED BRAIN
    const brain = {
        w1: nn.w1, b1: nn.b1,
        w2: nn.w2, b2: nn.b2
    };
    fs.writeFileSync("brain.json", JSON.stringify(brain), "utf8");
    console.log(" Brain saved.");

} catch (e) {
    console.error("Error:", e.message);
}