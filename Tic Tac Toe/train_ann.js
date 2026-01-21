//This files generate MLP ANN and train it
function relu(x){
    return Math.max(0, x);
}

function sigmoid(x){
    return 1/(1 + Math.exp(-x));
}

function relu_deriv(x){
    return x>0 ? 1 : 0;
}

function sigmoid_deriv(x){
    return sigmoid(x) * (1 - sigmoid(x));
}

class NeuralNetwork{
    constructor(){
        this.w1 = Array.from({length:18}, () =>
            Array.from({length:9}, () => Math.random()*0.2 - 0.1)
        );

        this.b1 = Array(18).fill(0);
        
        this.w2 = Array.from({length:9}, ()=>
            Array.from({length:18}, ()=> Math.random()*0.2 - 0.1)
        )
        this.b2 = Array(9).fill(0);
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
        
        this.a2 = this.z2.map(sigmoid);
        
        return this.a2;
    }

    train(x, y, lr=0.1){
        const out = this.forward(x);

        const dz2 = [];
        
        for(let i =0; i<out.length; i++){
            dz2.push((out[i]-y[i])*sigmoid_deriv(this.z2[i]));
        }
    
        const dz1 = Array(18).fill(0);
        for(let i=0; i<18; i++){
            for(let j=0; j<9; j++){
                dz1[i] += dz2[j]*this.w2[j][i];
            }
            dz1[i] *= relu_deriv((this.z1[i]));
        }

        for(let i=0; i<9; i++){
            for(let j=0; j<18; j++){
                this.w2[i][j] -= lr* dz2[i] * this.a1[j];
            }

            this.b2[i] -= lr* dz2[i];
        }

        

        for(let i=0; i<18; i++){
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
const data = [...jsonData.ruleBased, ...jsonData.minimax];

const nn = new NeuralNetwork();

for (let epoch = 0; epoch < 5000; epoch++) { 
    data.sort(() => Math.random() - 0.5); // shuffle at start

    for (const sample of data) {
        nn.train(sample.x, sample.y, 0.1);
    }

    // Calculate loss after this epoch
    let loss = 0;
    for (const sample of data) {
        const out = nn.forward(sample.x);
        loss += out.reduce((s, o, i) => s + (o - sample.y[i])**2, 0);
    }
    if(epoch % 100 === 0){
    console.log('Epoch', epoch, 'Loss:', loss.toFixed(2));
}
}
