console.time("Training Time");
//This files generate MLP ANN and train it
function relu(x){
    return Math.max(0, x);
}

// function sigmoid(x){
//     return 1/(1 + Math.exp(-x));
// }

function relu_deriv(x){
    return x>0 ? 1 : 0;
}

// function sigmoid_deriv(x){
//     return sigmoid(x) * (1 - sigmoid(x));
// }

function softmax(z){
    const max = Math.max(...z);
    const exp = z.map(v => Math.exp(v-max));
    const sum = exp.reduce((a, b) => a+b, 0);
    return exp.map(v => v/sum);
}

class NeuralNetwork{
    constructor(){
        this.w1 = Array.from({length:64}, () =>
            Array.from({length:9}, () => (Math.random() * 1.632) - 0.816)
        );

        this.b1 = Array(64).fill(0.2);
        
        this.w2 = Array.from({length:9}, ()=>
            Array.from({length:64}, ()=> Math.random()*0.942 - 0.471)
        )
        this.b2 = Array(9).fill(0.2);
    }

    forward(x){
        this.z1 = [];
        
        for(let i=0; i<this.w1.length; i++){
        
            let sum = this.b1[i];
        
            for(let j=0; j<this.w1[i].length; j++){
                sum+=this.w1[i][j]*x[j];
            }
        
            this.z1.push(sum);
        }

        this.a1 = this.z1.map(relu)
        
            this.z2 = this.w2.map((row, i)=> row.reduce((s, w, j) => s+w*this.a1[j], this.b2[i])
        );
        
        this.a2 = softmax(this.z2);
        //this.a2 = this.z2.map(sigmoid);
        
        return this.a2;
    }

    train(x, y, lr=0.1){
        const out = this.forward(x);

        const dz2 = [];
        
        for(let i =0; i<out.length; i++){
            dz2.push((out[i]-y[i]));
        }
    
        const dz1 = Array(64).fill(0);
        for(let i=0; i<64; i++){
            for(let j=0; j<9; j++){
                dz1[i] += dz2[j]*this.w2[j][i];
            }
            dz1[i] *= relu_deriv((this.z1[i]));
        }

        for(let i=0; i<9; i++){
            for(let j=0; j<64; j++){
                this.w2[i][j] -= lr* dz2[i] * this.a1[j];
            }

            this.b2[i] -= lr* dz2[i];
        }

        

        for(let i=0; i<64; i++){
            for(let j=0; j<9; j++){
                this.w1[i][j] -=lr*dz1[i]*x[j];
            }
                this.b1[i] -= lr*dz1[i];
        }
    }
    
}

//Node part
const fs = require('fs');

// Load JSON file
const raw = fs.readFileSync('data.json');
const jsonData = JSON.parse(raw);

// Merge rule-based and minimax into one array
//const data = [...jsonData.ruleBased, ...jsonData.minimax];

//Only RuleBased Data
const data = jsonData.ruleBased;

//Only minimax
//const data = jsonData.minimax;

const nn = new NeuralNetwork();

const LR = 0.01; 

for (let epoch = 0; epoch < 1000; epoch++) { 
    data.sort(() => Math.random() - 0.5);

    for (const sample of data) {
        nn.train(sample.x, sample.y, LR);
    }

    // Calculate loss AND ACCURACY after this epoch
    if(epoch % 50 === 0){
        let loss = 0;
        let correct = 0;

        for (const sample of data) {
            const out = nn.forward(sample.x);
            
            // Your Original MSE Loss Calculation
            //loss += out.reduce((s, o, i) => s + (o - sample.y[i])**2, 0);
            
            //Softmax Loss
            const idx = sample.y.indexOf(1);
            loss += -Math.log(out[idx] + 1e-19)

            const predictedMove = out.indexOf(Math.max(...out));
            const actualMove = sample.y.indexOf(1);

            if (predictedMove === actualMove) {
                correct++;
            }
        }
        
        const accuracy = (correct / data.length * 100).toFixed(2);
        console.log(`Epoch ${epoch} | Loss: ${loss.toFixed(2)} | Accuracy: ${accuracy}%`);
    }
}

console.timeEnd('Training Time')

const weights = {
    w1: nn.w1,
    w2: nn.w2,
    b1: nn.b1,
    b2:nn.b2,
    a1: nn.a1,
    a2: nn.a2
}

fs.writeFileSync("weight.json", JSON.stringify(weights), "utf8");
console.log('Weights are saved! ');