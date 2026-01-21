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
        
        this.w2 = Array.from({length:18}, ()=>
            Array.from({length:9}, ()=> Math.random()*0.2 - 0.1)
        )
        this.b2 = Array(18).fill(0);
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
        
        return this.z2;
        
    }

    train(x, y, lr=0.1){
        const out = this.forward(x);

        const dz2 = [];
        
        for(let i =0; i<out.length; i++){
            dz2.push(out[i]-y[i]);
        }

        for(let i=0; i<9; i++){
            for(let j=0; j<18; j++){
                this.w2[i][j] -= lr* this.dz2[i] * this.a1[j];
            }

            this.b2[i] -= lr*this.dz2[i];
        }

        const dz1 = Array(18).fill(0);
        for(let i=0; i<18; i++){
            for(let j=0; j<9; j++){
                dz1[i] += dz2[j]*this.w1[j][i];
            }
            dz1[j]* relu_deriv((this.dz1[i]));
        }

        for(let i=0; i<18; i++){
            for(let j=0; j<9; j++){
                this.w1[i][j] -=lr*dz1[i]*x[j];
            }
                this.b1[i] -= lr*dz1[i];
        }
    }
    
}