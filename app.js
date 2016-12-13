//Lets require/import the HTTP module
var HttpDispatcher = require('httpdispatcher');
var http = require('http');
var Web3 = require('web3');
var zlib = require('zlib');
var lightwallet = require('eth-lightwallet');
var W3Provider = require('hooked-web3-provider');
var contractABI = [{ "constant": true, "inputs": [], "name": "GetRequiredSubscribers", "outputs": [{ "name": "", "type": "address[]" }], "payable": false, "type": "function" }, { "constant": false, "inputs": [{ "name": "newOwner", "type": "address" }], "name": "SetOwner", "outputs": [], "payable": false, "type": "function" }, { "constant": false, "inputs": [{ "name": "member", "type": "address" }], "name": "AddSubscriber", "outputs": [], "payable": false, "type": "function" }, { "constant": true, "inputs": [], "name": "ReadContent", "outputs": [{ "name": "", "type": "string" }], "payable": false, "type": "function" }, { "constant": false, "inputs": [], "name": "Sign", "outputs": [{ "name": "", "type": "string" }], "payable": false, "type": "function" }, { "constant": true, "inputs": [], "name": "GetSignedSubscribers", "outputs": [{ "name": "", "type": "address[]" }], "payable": false, "type": "function" }, { "constant": false, "inputs": [{ "name": "members", "type": "address[]" }], "name": "AddSubscribers", "outputs": [], "payable": false, "type": "function" }, { "constant": false, "inputs": [{ "name": "member", "type": "address" }], "name": "RemoveSubscriber", "outputs": [], "payable": false, "type": "function" }, { "inputs": [{ "name": "blob", "type": "bytes" }], "payable": false, "type": "constructor" }];

var web3 = new Web3();
var dispatcher = new HttpDispatcher();
var global_keystore;


function setWeb3Provider(keystore) {
    var web3Provider = new W3Provider({
        host: "http://localhost:8545",
        transaction_signer: keystore,
    });

    web3.setProvider(web3Provider);
}
setSeed();

//Lets define a port we want to listen to
const PORT = 8080;

//For all your static (js/css/images/etc.) set the directory name (relative path).
dispatcher.setStatic('resources');

//A sample GET request    
dispatcher.onGet('/balance', function (req, res) {
    console.log(req.headers.wallet);
    web3.eth.getBalance(req.headers.wallet, function (error, result) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ "error": error, "result": web3.fromWei(result, 'ether') }));
    });
});
function endMessage(code, message, kind, res) {
    console.log(message);
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ kind: message }));
}
//A sample POST request
dispatcher.onPost("/storeContractData", function (req, res) {
    if (req.headers.contractdata === undefined) {
        endMessage(500, 'The contract data is empty or undefined.', 'error', res);
    }
    var cdata = zlib.deflateSync(req.headers.contractdata).toString('base64');
    if (cdata.length > 4096) {
        endMessage(500, 'The contract data is too big.', 'error', res);
    }

    var Contract = web3.eth.contract(contractABI)

    var contractCode = '60606040523461000057604051610d41380380610d41833981016040528080518201919060200150505b33600060006101000a81548173ffffffffffffffffffffffffffffffffffffffff02191690836c0100000000000000000000000090810204021790555042600060146101000a81548167ffffffffffffffff021916908378010000000000000000000000000000000000000000000000009081020402179055508060019080519060200190828054600181600116156101000203166002900490600052602060002090601f016020900481019282601f106100ef57805160ff191683800117855561011d565b8280016001018555821561011d579182015b8281111561011c578251825591602001919060010190610101565b5b50905061014291905b8082111561013e576000816000905550600101610126565b5090565b50505b505b610bec806101556000396000f360606040523615610086576000357c01000000000000000000000000000000000000000000000000000000009004806314bc53441461008b578063167d3e9c146100e25780633786d027146100ff578063ae87a0371461011c578063b5d7df9714610197578063bfa3f4b114610212578063c527fa7d14610269578063f0cf198a146102bd575b610000565b34610000576100986102da565b60405180806020018281038252838181518152602001915080519060200190602002808383829060006004602084601f0104600302600f01f1509050019250505060405180910390f35b34610000576100fd6004808035906020019091905050610365565b005b346100005761011a60048080359060200190919050506103fe565b005b34610000576101296104f2565b60405180806020018281038252838181518152602001915080519060200190808383829060006004602084601f0104600302600f01f150905090810190601f1680156101895780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b34610000576101a46105a7565b60405180806020018281038252838181518152602001915080519060200190808383829060006004602084601f0104600302600f01f150905090810190601f1680156102045780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b346100005761021f6107d4565b60405180806020018281038252838181518152602001915080519060200190602002808383829060006004602084601f0104600302600f01f1509050019250505060405180910390f35b34610000576102bb60048080359060200190820180359060200190808060200260200160405190810160405280939291908181526020018383602002808284378201915050505050509190505061085f565b005b34610000576102d86004808035906020019091905050610986565b005b6020604051908101604052806000815260200150600280548060200260200160405190810160405280929190818152602001828054801561035a57602002820191906000526020600020905b8160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681526020019060010190808311610326575b505050505090505b90565b600060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614156103fa5780600060006101000a81548173ffffffffffffffffffffffffffffffffffffffff02191690836c010000000000000000000000009081020402179055505b5b5b50565b600060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614156104ee576002805480600101828181548183558181151161049d5781836000526020600020918201910161049c91905b80821115610498576000816000905550600101610480565b5090565b5b505050916000526020600020900160005b83909190916101000a81548173ffffffffffffffffffffffffffffffffffffffff02191690836c01000000000000000000000000908102040217905550505b5b5b50565b602060405190810160405280600081526020015060018054600181600116156101000203166002900480601f01602080910402602001604051908101604052809291908181526020018280546001816001161561010002031660029004801561059c5780601f106105715761010080835404028352916020019161059c565b820191906000526020600020905b81548152906001019060200180831161057f57829003601f168201915b505050505090505b90565b60206040519081016040528060008152602001506000600060006105ca33610a68565b92507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff83141561065b57606060405190810160405280602781526020017f7468652070726f7669646564206d656d626572206973206e6f7420612073756281526020017f736372696265720000000000000000000000000000000000000000000000000081526020015093506107ce565b82915061066733610b2a565b90507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff811415156106f957606060405190810160405280602881526020017f746865206d656d62657220616c7265616479207369676e65642074686973206181526020017f677265656d656e7400000000000000000000000000000000000000000000000081526020015093506107ce565b600380548060010182818154818355818115116107425781836000526020600020918201910161074191905b8082111561073d576000816000905550600101610725565b5090565b5b505050916000526020600020900160005b33909190916101000a81548173ffffffffffffffffffffffffffffffffffffffff02191690836c0100000000000000000000000090810204021790555050604060405190810160405280602081526020017f7369676e617475726520636f6c6c65637465642077697468207375636365737381526020015093505b50505090565b6020604051908101604052806000815260200150600380548060200260200160405190810160405280929190818152602001828054801561085457602002820191906000526020600020905b8160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681526020019060010190808311610820575b505050505090505b90565b6000600060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff16141561098157600090505b815181101561097f576002805480600101828181548183558181151161090e5781836000526020600020918201910161090d91905b808211156109095760008160009055506001016108f1565b5090565b5b505050916000526020600020900160005b848481518110156100005790602001906020020151909190916101000a81548173ffffffffffffffffffffffffffffffffffffffff02191690836c01000000000000000000000000908102040217905550505b80806001019150506108bc565b5b5b5b5050565b6000600060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff161415610a6357600060038054905011156109f157610a62565b6109fa82610a68565b90507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff81141515610a6157600281815481101561000057906000526020600020900160005b6101000a81549073ffffffffffffffffffffffffffffffffffffffff02191690555b5b5b5b5050565b60006000600090505b600280549050811015610b0057600281815481101561000057906000526020600020900160005b9054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff161415610af257809150610b24565b5b8080600101915050610a71565b7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff91505b50919050565b60006000600090505b600380549050811015610bc257600381815481101561000057906000526020600020900160005b9054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff161415610bb457809150610be6565b5b8080600101915050610b33565b7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff91505b5091905056';

    var address = global_keystore.getAddresses();


    //4712388
    //5000000
    try {

        var contractInstance = Contract.new(cdata, {
            data: contractCode,
            gas: 4712388,
            gasPrice: 50000000000,
            from: address[0]
        }, function (err, myContract) {
            if (!err) {
                // NOTE: The callback will fire twice!
                // Once the contract has the transactionHash property set and once its deployed on an address.

                // e.g. check tx hash on the first call (transaction send)
                if (!myContract.address) {
                    endMessage(200, myContract.transactionHash, 'transactionHash', res);
                    // check address on the second call (contract deployed)
                } else {
                    endMessage(200, myContract.address, 'contractAddress', res);
                }
                // Note that the returned "myContractReturned" === "myContract",
                // so the returned "myContractReturned" object will also get the address set.
            } else {
                endMessage(500, err.message, 'error', res);
            }
        });
    } catch (exception) {
        endMessage(500, exception.message, 'error', res);
    }


});

function setSeed() {
    lightwallet.keystore.deriveKeyFromPassword('123123', function (err, pwDerivedKey) {
        global_keystore = new lightwallet.keystore(
            'rather yard satisfy foot kiss ketchup total faith cream hospital cruise run',
            pwDerivedKey);

        global_keystore.generateNewAddress(pwDerivedKey, 1);
        global_keystore.passwordProvider = function (callback) {
            callback(null, '123123');
        }
        setWeb3Provider(global_keystore);
    });
}

//We need a function which handles requests and send response
//Lets use our dispatcher
function handleRequest(request, response) {
    try {
        //Disptach
        dispatcher.dispatch(request, response);
    } catch (err) {
        console.log(err);
    }
}
//Create a server
var server = http.createServer(handleRequest);

//Lets start our server
server.listen(PORT, function () {
    //Callback triggered when server is successfully listening. Hurray!
    console.log("Server listening on: http://localhost:%s", PORT);
});