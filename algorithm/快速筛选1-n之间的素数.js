const printPrime = function(n) {
    let primes = Array(n).fill(1), res = []
    primes[0] = primes[1] = 0
    for(let i = 2; i <= n; i++) {
        if(primes[i]) {
            res.push(i)
            //把i的倍数筛出去
            for(let j = i * i; j <= n; j += i) {
                primes[j] = 0
            }
        }
    }
    return res
}
