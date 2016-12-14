//Lets require/import the HTTP module
var HttpDispatcher = require('httpdispatcher');
var http = require('http');
var Web3 = require('web3');
var zlib = require('zlib');
var lightwallet = require('eth-lightwallet');
var W3Provider = require('hooked-web3-provider');
var contractABI = [{ "constant": true, "inputs": [], "name": "GetRequiredSubscribers", "outputs": [{ "name": "", "type": "address[]" }], "payable": false, "type": "function" }, { "constant": false, "inputs": [{ "name": "newOwner", "type": "address" }], "name": "SetOwner", "outputs": [], "payable": false, "type": "function" }, { "constant": false, "inputs": [{ "name": "member", "type": "address" }], "name": "AddSubscriber", "outputs": [], "payable": false, "type": "function" }, { "constant": true, "inputs": [], "name": "ReadContent", "outputs": [{ "name": "", "type": "bytes" }], "payable": false, "type": "function" }, { "constant": false, "inputs": [], "name": "Sign", "outputs": [], "payable": false, "type": "function" }, { "constant": true, "inputs": [], "name": "GetSignedSubscribers", "outputs": [{ "name": "", "type": "address[]" }], "payable": false, "type": "function" }, { "constant": false, "inputs": [{ "name": "members", "type": "address[]" }], "name": "AddSubscribers", "outputs": [], "payable": false, "type": "function" }, { "constant": false, "inputs": [{ "name": "member", "type": "address" }], "name": "RemoveSubscriber", "outputs": [], "payable": false, "type": "function" }, { "inputs": [{ "name": "blob", "type": "bytes" }], "payable": false, "type": "constructor" }, { "anonymous": false, "inputs": [{ "indexed": false, "name": "", "type": "string" }], "name": "SendMessage", "type": "event" }];

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

function useHeadersSeed(req, res, callback) {
    if (req.headers.words === undefined) {
        endMessage(500, 'The wallet data is empty or undefined.', 'error', res);
    }

    if (req.headers.signature === undefined) {
        endMessage(500, 'The wallet signature is empty or undefined.', 'error', res);
    }

    setSeed(req.headers.words, req.headers.signature, callback, req, res);
}

dispatcher.onPost("/sign", function (req, res) {
    if (req.headers.contractaddress === undefined) {
        endMessage(500, 'The contract address is empty or undefined.', 'error', res);
    }

    useHeadersSeed(req, res, function (req, res) {
        var Contract = web3.eth.contract(contractABI);
        var args = []
        var block = web3.eth.getBlock('latest').number;
        try {
            var instance = Contract.at(req.headers.contractaddress);
            var signedEvent = instance.SendMessage(null, { fromBlock: 0, toBlock: 'latest' });
            signedEvent.watch(function (err, result) {
                if (result.blockNumber > block) {
                    if (!err)
                        endMessage(200, result.args[""], 'sucess', res);
                    else
                        endMessage(500, err, 'sign error', res);
                    
                    signedEvent.stopWatching();
                }
            });
            instance.Sign({ from: global_keystore.getAddresses()[0], "value": null, "gasPrice": 50000000000, "gas": 314159 }, function (err, result) {
                if (err) endMessage(500, err, 'sign error', res);
            });
            //var result = instance.Sign({gas: 3141592, gasPrice: 50000000000});
        } catch (exception) {
            endMessage(500, exception, 'error', res);
        }
    });
});

//A sample POST request
dispatcher.onPost("/storeContractData", function (req, res) {

    if (req.headers.contractdata === undefined) {
        endMessage(500, 'The contract data is empty or undefined.', 'error', res);
    }
    var cdata = zlib.deflateSync(req.headers.contractdata).toString('base64');
    if (cdata.length > 4096) {
        cdata = jszip.generateAsync({ type: "string" })
        endMessage(500, 'The contract data is too big.', 'error', res);
    }

    useHeadersSeed(req, res, function (req, res) {
        var Contract = web3.eth.contract(contractABI)

        var contractCode = '60606040523461000057604051610dc3380380610dc3833981016040528080518201919060200150505b33600060006101000a81548173ffffffffffffffffffffffffffffffffffffffff02191690836c0100000000000000000000000090810204021790555042600060146101000a81548167ffffffffffffffff021916908378010000000000000000000000000000000000000000000000009081020402179055508060019080519060200190828054600181600116156101000203166002900490600052602060002090601f016020900481019282601f106100ef57805160ff191683800117855561011d565b8280016001018555821561011d579182015b8281111561011c578251825591602001919060010190610101565b5b50905061014291905b8082111561013e576000816000905550600101610126565b5090565b50507f3b7e5ce22aaed8c7066618e3d648520147681e91cfe1d4df9bcab1b1112dffbb6040518080602001828103825260078152602001807f437265617465640000000000000000000000000000000000000000000000000081526020015060200191505060405180910390a15b505b610c03806101c06000396000f360606040523615610086576000357c01000000000000000000000000000000000000000000000000000000009004806314bc53441461008b578063167d3e9c146100e25780633786d027146100ff578063ae87a0371461011c578063b5d7df9714610197578063bfa3f4b1146101a6578063c527fa7d146101fd578063f0cf198a14610251575b610000565b346100005761009861026e565b60405180806020018281038252838181518152602001915080519060200190602002808383829060006004602084601f0104600302600f01f1509050019250505060405180910390f35b34610000576100fd60048080359060200190919050506102f9565b005b346100005761011a6004808035906020019091905050610392565b005b3461000057610129610486565b60405180806020018281038252838181518152602001915080519060200190808383829060006004602084601f0104600302600f01f150905090810190601f1680156101895780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b34610000576101a461053b565b005b34610000576101b3610780565b60405180806020018281038252838181518152602001915080519060200190602002808383829060006004602084601f0104600302600f01f1509050019250505060405180910390f35b346100005761024f60048080359060200190820180359060200190808060200260200160405190810160405280939291908181526020018383602002808284378201915050505050509190505061080b565b005b346100005761026c600480803590602001909190505061099d565b005b602060405190810160405280600081526020015060028054806020026020016040519081016040528092919081815260200182805480156102ee57602002820191906000526020600020905b8160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16815260200190600101908083116102ba575b505050505090505b90565b600060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff16141561038e5780600060006101000a81548173ffffffffffffffffffffffffffffffffffffffff02191690836c010000000000000000000000009081020402179055505b5b5b50565b600060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff16141561048257600280548060010182818154818355818115116104315781836000526020600020918201910161043091905b8082111561042c576000816000905550600101610414565b5090565b5b505050916000526020600020900160005b83909190916101000a81548173ffffffffffffffffffffffffffffffffffffffff02191690836c01000000000000000000000000908102040217905550505b5b5b50565b602060405190810160405280600081526020015060018054600181600116156101000203166002900480601f0160208091040260200160405190810160405280929190818152602001828054600181600116156101000203166002900480156105305780601f1061050557610100808354040283529160200191610530565b820191906000526020600020905b81548152906001019060200180831161051357829003601f168201915b505050505090505b90565b600060006000600090505b60028054905081101561077a57600281815481101561000057906000526020600020900160005b9054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff16141561076c576105c833610a7f565b91507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff82141515610663577f3b7e5ce22aaed8c7066618e3d648520147681e91cfe1d4df9bcab1b1112dffbb60405180806020018281038252600e8152602001807f416c7265616479207369676e656400000000000000000000000000000000000081526020015060200191505060405180910390a161076b565b600380548060010182818154818355818115116106ac578183600052602060002091820191016106ab91905b808211156106a757600081600090555060010161068f565b5090565b5b505050916000526020600020900160005b33909190916101000a81548173ffffffffffffffffffffffffffffffffffffffff02191690836c0100000000000000000000000090810204021790555050600192507f3b7e5ce22aaed8c7066618e3d648520147681e91cfe1d4df9bcab1b1112dffbb6040518080602001828103825260068152602001807f5369676e6564000000000000000000000000000000000000000000000000000081526020015060200191505060405180910390a15b5b5b8080600101915050610546565b5b505050565b6020604051908101604052806000815260200150600380548060200260200160405190810160405280929190818152602001828054801561080057602002820191906000526020600020905b8160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16815260200190600101908083116107cc575b505050505090505b90565b6000600060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff16141561099857600090505b815181101561092b57600280548060010182818154818355818115116108ba578183600052602060002091820191016108b991905b808211156108b557600081600090555060010161089d565b5090565b5b505050916000526020600020900160005b848481518110156100005790602001906020020151909190916101000a81548173ffffffffffffffffffffffffffffffffffffffff02191690836c01000000000000000000000000908102040217905550505b8080600101915050610868565b7f3b7e5ce22aaed8c7066618e3d648520147681e91cfe1d4df9bcab1b1112dffbb6040518080602001828103825260108152602001807f537562736372696265722061646465640000000000000000000000000000000081526020015060200191505060405180910390a15b5b5b5050565b6000600060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff161415610a7a5760006003805490501115610a0857610a79565b610a1182610b41565b90507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff81141515610a7857600281815481101561000057906000526020600020900160005b6101000a81549073ffffffffffffffffffffffffffffffffffffffff02191690555b5b5b5b5050565b60006000600090505b600380549050811015610b1757600381815481101561000057906000526020600020900160005b9054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff161415610b0957809150610b3b565b5b8080600101915050610a88565b7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff91505b50919050565b60006000600090505b600280549050811015610bd957600281815481101561000057906000526020600020900160005b9054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff161415610bcb57809150610bfd565b5b8080600101915050610b4a565b7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff91505b5091905056';

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
                        // endMessage(200, myContract.transactionHash, 'transactionHash', res);
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
});

function setSeed(seed, password, callback, req, res) {
    lightwallet.keystore.deriveKeyFromPassword(password, function (err, pwDerivedKey) {
        global_keystore = new lightwallet.keystore(
            seed,
            pwDerivedKey);

        global_keystore.generateNewAddress(pwDerivedKey, 1);
        global_keystore.passwordProvider = function (callback) {
            callback(null, password);
        }
        setWeb3Provider(global_keystore);
        callback(req, res);
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