console.time("Training Time");

// ===========================
// MATH HELPERS
// ===========================
function relu(x) { return Math.max(0, x); }
function relu_deriv(x) { return x > 0 ? 1 : 0; }

function softmax(arr) {
    const maxVal = Math.max(...arr);
    const exps = arr.map(x => Math.exp(x - maxVal));
    const sumExps = exps.reduce((a, b) => a + b, 0);
    return exps.map(x => x / sumExps);
}

// ===========================
// NEURAL NETWORK
// ===========================
class NeuralNetwork {
    constructor() {
        // He Initialization (Scaled down slightly for safety)
        this.w1 = Array.from({length: 64}, () => 
            Array.from({length: 9}, () => (Math.random() - 0.5) * 0.5) 
        );
        this.b1 = Array(64).fill(0.0);
        
        this.w2 = Array.from({length: 9}, () => 
            Array.from({length: 64}, () => (Math.random() - 0.5) * 0.5) 
        );
        this.b2 = Array(9).fill(0.0);

        // Momentum Velocities
        this.v_w1 = Array.from({length: 64}, () => Array(9).fill(0));
        this.v_b1 = Array(64).fill(0);
        this.v_w2 = Array.from({length: 9}, () => Array(64).fill(0));
        this.v_b2 = Array(9).fill(0);
        
        this.beta = 0.9;
    }

    forward(x) {
        this.z1 = [];
        for(let i=0; i<this.w1.length; i++) {
            let sum = this.b1[i];
            for(let j=0; j<this.w1[i].length; j++) {
                sum += this.w1[i][j] * x[j];
            }
            this.z1.push(sum);
        }

        this.a1 = this.z1.map(relu);
        
        this.z2 = this.w2.map((row, i) => 
            row.reduce((s, w, j) => s + w * this.a1[j], this.b2[i])
        );
        
        this.a2 = softmax(this.z2);
        return this.a2;
    }

    train(x, y, lr) {
        const out = this.forward(x);

        // 1. Output Gradient (Softmax + CrossEntropy = out - y)
        const dz2 = out.map((o, i) => o - y[i]);
    
        // 2. Hidden Gradient
        const dz1 = Array(64).fill(0);
        for(let i=0; i<64; i++) {
            for(let j=0; j<9; j++) {
                dz1[i] += dz2[j] * this.w2[j][i];
            }
            dz1[i] *= relu_deriv(this.z1[i]);
        }

        // 3. Update Layer 2 (Momentum)
        for(let i=0; i<9; i++) {
            for(let j=0; j<64; j++) {
                const grad = dz2[i] * this.a1[j];
                this.v_w2[i][j] = (this.beta * this.v_w2[i][j]) + (lr * grad);
                this.w2[i][j] -= this.v_w2[i][j];
            }
            this.v_b2[i] = (this.beta * this.v_b2[i]) + (lr * dz2[i]);
            this.b2[i] -= this.v_b2[i];
        }

        // 4. Update Layer 1 (Momentum)
        for(let i=0; i<64; i++) {
            for(let j=0; j<9; j++) {
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
    const data = [...jsonData.ruleBased, ...jsonData.minimax];

    console.log(`Loaded ${data.length} samples.`);
    const nn = new NeuralNetwork();

    // CRITICAL FIX: Lower Learning Rate for Cross-Entropy
    const LEARNING_RATE = 0.0005; 

    for (let epoch = 0; epoch <= 200; epoch++) { 
        data.sort(() => Math.random() - 0.5); 

        for (const sample of data) {
            nn.train(sample.x, sample.y, LEARNING_RATE);
        }

        if (epoch % 50 === 0) {
            let loss = 0;
            let correct = 0;
            
            for (const sample of data) {
                const out = nn.forward(sample.x);
                
                // Loss Calc
                const correctIndex = sample.y.indexOf(1);
                loss += -Math.log(Math.max(out[correctIndex], 1e-10));
                
                // Accuracy Calc
                const predictedMove = out.indexOf(Math.max(...out));
                if (predictedMove === correctIndex) correct++;
            }
            
            const acc = (correct / data.length * 100).toFixed(2);
            console.log(`Epoch ${epoch} | Loss: ${loss.toFixed(0)} | Accuracy: ${acc}%`);
        }
    }
    console.timeEnd("Training Time");

} catch (e) {
    console.error("Error:", e.message);
}