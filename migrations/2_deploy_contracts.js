const fs = require('fs') //FileSystem모듈을 받아온다.
const AdditionGame = artifacts.require('./AdditionGame.sol')

// truffle로 배포할 때 얻을 수 있는 데이터들을 deployedABI와 deployedAddress 파일들에 저장한다.
module.exports = function (deployer) { 
  deployer.deploy(AdditionGame)
    .then(() =>{
        if(AdditionGame._json) {
            fs.writeFile('deployedABI', JSON.stringify(AdditionGame._json.abi), 
            // fs에서 writeFile함수는 두개의 인자를 받는데 여기서는 첫번째 인자 파일을 읽고 거기에 AdditionGame컨트랙트의 abi를 json형식으로 받고 문자열로 넣는다.
                (err) => {
                    if (err) throw err;
                    console.log("파일에 ABI 입력 성공");
                }
            )
            fs.writeFile('deployedAddress', AdditionGame.address,
                (err) => {
                    if (err) throw err;
                    console.log("파일에 주소 입력 성공");
                }
            )
        }
    })
}