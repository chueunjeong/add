// truffle.js config for klaytn.
const HDWalletProvider = require('truffle-hdwallet-provider-klaytn'); //기존의 모듈은 klaytn에서 새로운 모듈로 바꿨으니 주의
const NETWORK_ID = '1001'; //바오밥 고유 network id
const GASLIMIT = '20000000'; //배포시에 사용되는 gas limit
const URL = 'https://api.baobab.klaytn.net:8651'; //klaytn의 풀노드가 작동하는 포트
const PRIVATE_KEY = '0x8f1f41616a7cf63599b70bf5446bf78de876bad36fa149d5377623288e8ec9e3'; //klaytn wallet에서 만든 private key 입력

module.exports = {
    networks: {
        klaytn : {
            provider: new HDWalletProvider(PRIVATE_KEY,URL),
            network_id : NETWORK_ID,
            gas: GASLIMIT,
            gasPrice: null,
        }
    },
    compilers: {
        solc: {
          version: "0.4.24",
              }
              },
};
// 해당 모듈은 우선 network는 klaytn을 사용하고, 그 안에 4개의 옵션을 설정
// provider는 공급자로 new PKC 인스턴스를 만들고 내부에 두개의 인자를 받는다. 개인키와 URL주소
// network_id와 gas는 보이는데로 설정됬고, gasPrice는 값이 없는 이유는 klaytn이 자동으로 설정하기 때문이다.