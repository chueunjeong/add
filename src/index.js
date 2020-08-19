import Caver from "caver-js";
import {Spinner} from "spin.js";
// agContract에서 받는 두 인자는 webpack.config.js에서 받는다.
const config = {
  rpcURL : "https://api.baobab.klaytn.net:8651"
} // config안에 rpcURL 존재

const cav = new Caver(config.rpcURL); // instance화 작업 
const agContract = new cav.klay.Contract(DEPLOYED_ABI, DEPLOYED_ADDRESS);
// 두 인자는 BAPP내의 전역상수 (webpack.config.js에 존재)
const App = {
  auth : {
    accessType : "keystore",
    keystore : '',
    password : ''
  },

  start: async function () {
    const walletFromSession = sessionStorage.getItem('walletInstance');
    // key값을 넘기면 쌍으로 저장됐던 value값을 받아오고 walletFromSession에 저장

    if(walletFromSession) { // 값이 존재한다면 (로그인을 했었다면)
      try {
        cav.klay.accounts.wallet.add(JSON.parse(walletFromSession)); 
        this.changeUI(JSON.parse(walletFromSession)); // login 돼었다는 상태를 보여주기 위해 UI 업데이트
      } catch (e) {
        sessionStorage.removeItem('walletInstance');  // 유효한 주소가 아니라면 지운다.
      }
    }
  },

  handleImport: async function () { // file이 유효한지를 확인
    const fileReader = new FileReader();
    fileReader.readAsText(event.target.files[0]);
    fileReader.onload = (event) => {
      try {
        if(!this.checkValidKeystore(event.target.result)) {
          $('#message').text('유효하지 않은 keystore 파일입니다.');
          return;
        }
        this.auth.keystore = event.target.result;
        $('#message').text('Keystore 통과. 비밀번호를 입력하시오.');
        document.querySelector('#input-password').focus();
      } catch (event) {
        $('#message').text('유효하지 않은 keystore 파일입니다.');
        return;
      }
    } 
  },  

  handlePassword: async function () {
    this.auth.password = event.target.value;
  },

  handleLogin: async function () {
    if(this.auth.accessType === 'keystore') {
      try {
        const privateKey = cav.klay.accounts.decrypt(this.auth.keystore, 
                                                     this.auth.password).privateKey;
        // caver 인스턴스에 account 멤버를 통해서 decrypt 함수를 쓸 수 있다.
        this.integrateWallet(privateKey);
      }catch (e) {
        $('#message').text('비밀번호가 일치하지 않습니다.');
      }
    }
  },

  handleLogout: async function () {
    this.removeWallet();
    location.reload();
  },

  generateNumbers: async function () {
    var num1 = Math.floor(( Math.random() * 50 ) + 10); 
    var num2 = Math.floor(( Math.random() * 50 ) + 10); // 10~59의 random number

    sessionStorage.setItem('result', num1+num2);

    $('#start').hide();
    $('#num1').text(num1);
    $('#num2').text(num2);
    $('#question').show();
    document.querySelector('#answer').focus();

    this.showTimer();
  },

  submitAnswer: async function () {
    const result = sessionStorage.getItem('result');
    var answer = $('#answer').val();  // 사용자가 낸 답 변수에 저장

    if(answer === result) {
      if(confirm("Correct!! 0.1KLAY 받기")) {
        if(await this.callContractBalance() >= 0.1) {
          this.receiveKlay();
        }
        else {
          alert("죄송합니다. contract의 KLAY가 다 소모되었습니다.");
        }
      }
    }
    else {
      alert("It's not correct!!")
    }
  },

  deposit: async function () {
    var spinner = this.showSpinner();
    const walletInstance = this.getWallet();

    if (walletInstance) {
      if (await this.callOwner() !== walletInstance.address) return; //값이 없는 return은 함수를 그냥 종료시킨다.
      else {
        var amount = $('#amount').val();
        if (amount) {
          agContract.methods.deposit().send({
            from: walletInstance.address,
            gas: '200000',
            value: cav.utils.toPeb(amount, "KLAY")
          })        
          .once('transactionHash', (txHash) => {
            console.log(`txHash: ${txHash}`);
          })
          .once('receipt', (receipt) => {
            console.log(`(#${receipt.blockNumber})`, receipt); //Received receipt! It means your transaction(calling plus function) is in klaytn block                          
            spinner.stop();  
            alert(amount + " KLAY를 컨트랙에 송금했습니다.");               
            location.reload();//page새로고침하여 Contract의 잔액을 보게 한다.      
          })
          .once('error', (error) => {
            alert(error.message);
          }); 
        }
        return;    
      }
    }
  },


     
  callOwner: async function () {
    return await agContract.methods.owner().call();
  },

  callContractBalance: async function () {
    return await agContract.methods.getBalance().call();
  },  // contract instance를 통해 getBalance함수에 접근하여 값을 불러온다.

  getWallet: function () {
    // caver내부에 존재하는 내 계정 정보를 가져옴
    if(cav.klay.accounts.wallet.length) {
      return cav.klay.accounts.wallet[0]; // wallet에 추가된 계정들 중 첫번째 계정 (현재 로그인된 계정)
    }
  },

  checkValidKeystore: function (keystore) {
    const parsedKeystore = JSON.parse(keystore);
    const isValidKeystore = parsedKeystore.version &&
      parsedKeystore.id &&
      parsedKeystore.address &&
      parsedKeystore.crypto;

    return isValidKeystore;

  },

  integrateWallet: function (privateKey) {
    const walletInstance = cav.klay.accounts.privateKeyToAccount(privateKey);
    cav.klay.accounts.wallet.add(walletInstance);
    sessionStorage.setItem('walletInstance', JSON.stringify(walletInstance));
    this.changeUI(walletInstance);
  },

  reset: function () {
    this.auth = {
      keystore : '',
      password : ''
    };
  },

  changeUI: async function (walletInstance) {
    $('#loginModal').modal('hide'); //로그인 했을시 login창을 없애고 logout창을 보여준다.
    $('#login').hide();
    $('#logout').show();
    $('#game').show();

    $('#address').append('<br>' + '<p>' + "내 계정 주소 : " + walletInstance.address + '</p>');
    //id가 address인곳에 append로 뒤에 로그인된 계정 주소 메세지를 붙인다.
    
    $('#contractBalance').append('<p>' + "이벤트 잔액 : " + cav.utils.fromPeb(await this.callContractBalance(), "KLAY") + 'KLAY' +'</p>');
    //잔액을 보여주는 id에 메세지를 넣는다. callContractBalance함수를 써서 잔액(peb단위를 klay단위로 변환)을 불러온다.

    if(await this.callOwner() === walletInstance.address) {
      $('#owner').show();
    }
  },

  removeWallet: function () {
    cav.klay.accounts.wallet.clear();
    sessionStorage.removeItem('walletInstance');
    this.reset();
  },

  showTimer: function () {
    var seconds = 3;
    $('#timer').text(seconds);

    var interval = setInterval(() => {
      $('#timer').text(--seconds);
      if(seconds <= 0 ) {
        $('#timer').text('');
        $('#answer').val('');
        $('#question').hide();
        $('#start').show();
        clearInterval(interval);  // setInterval안에서 돌아가는 시간을 멈추게 함
      }
    }, 1000);
  },

  showSpinner: function () {
    var target = document.getElementById("spin");
    return new Spinner(opts).spin(target);
  },

  receiveKlay: function () {
    var spinner = this.showSpinner();
    const walletInstance = this.getWallet();

    if (!walletInstance) return;

    console.log(agContract);
    console.log(walletInstance.address);
    console.log(this.callOwner())

    agContract.methods.transfer(cav.utils.toPeb("0.1", "KLAY")).send({
      from : walletInstance.address, //계정 인증된 내 주소
      gas : '250000'
    })
    .then(function (receipt) {
      if(receipt.status) {
        spinner.stop();
        alert("0.1 KLAY가 " + walletInstance.address +" 계정으로 지급되었습니다.");
        $('#transaction').html(""); 
        $('#transaction')
        .append(`<p><a href='https://baobab.scope.klaytn.com/tx/${receipt.transactionHash}'
                      target='_blank'> Klaytn Scope에서 transaction 확인</a></p>`);
      
        return agContract.methods.getBalance().call()
        .then(function(balance) {
          $('#contractBalance').html("");
          $('#contractBalance')
          .append('<p>' + '이벤트 잔액 : ' + cav.utils.fromPeb(balance, "KLAY") + 'KLAY' + '</p>')
        })
      }
    })
  }
};

window.App = App;

window.addEventListener("load", function () {
  App.start();
});

var opts = {
  lines: 10, // The number of lines to draw
  length: 30, // The length of each line
  width: 17, // The line thickness
  radius: 45, // The radius of the inner circle
  scale: 1, // Scales overall size of the spinner
  corners: 1, // Corner roundness (0..1)
  color: '#5bc0de', // CSS color or array of colors
  fadeColor: 'transparent', // CSS color or array of colors
  speed: 1, // Rounds per second
  rotate: 0, // The rotation offset
  animation: 'spinner-line-fade-quick', // The CSS animation name for the lines
  direction: 1, // 1: clockwise, -1: counterclockwise
  zIndex: 2e9, // The z-index (defaults to 2000000000)
  className: 'spinner', // The CSS class to assign to the spinner
  top: '50%', // Top position relative to parent
  left: '50%', // Left position relative to parent
  shadow: '0 0 1px transparent', // Box-shadow for the lines
  position: 'absolute' // Element positioning
};