/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import {
  Signer,
  utils,
  Contract,
  ContractFactory,
  BigNumberish,
  Overrides,
} from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../common";
import type {
  SC_ProcessChannel,
  SC_ProcessChannelInterface,
} from "../SC_ProcessChannel";

const _abi = [
  {
    inputs: [
      {
        internalType: "address[5]",
        name: "_participants",
        type: "address[5]",
      },
      {
        internalType: "uint256",
        name: "_disputeWindowInUNIX",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
    ],
    name: "continueAfterDispute",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "disputeMadeAtUNIX",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "disputeWindowInUNIX",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "index",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "participants",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "index",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "caseID",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "from",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "taskID",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "newTokenState",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "conditionState",
            type: "uint256",
          },
          {
            internalType: "bytes[5]",
            name: "signatures",
            type: "bytes[5]",
          },
        ],
        internalType: "struct SC_ProcessChannel.Step",
        name: "_step",
        type: "tuple",
      },
    ],
    name: "submit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "tokenState",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

const _bytecode =
  "0x60a060405260016000556000600155600060025534801561001f57600080fd5b5060405162000c0838038062000c08833981016040819052610040916100f6565b61004d6003836005610057565b506080525061017f565b826005810192821561009f579160200282015b8281111561009f57825182546001600160a01b0319166001600160a01b0390911617825560209092019160019091019061006a565b506100ab9291506100af565b5090565b5b808211156100ab57600081556001016100b0565b634e487b7160e01b600052604160045260246000fd5b80516001600160a01b03811681146100f157600080fd5b919050565b60008060c0838503121561010957600080fd5b83601f84011261011857600080fd5b60405160a081016001600160401b038111828210171561013a5761013a6100c4565b6040528060a085018681111561014f57600080fd5b855b8181101561017057610162816100da565b835260209283019201610151565b50519196919550909350505050565b608051610a60620001a86000396000818160dc0152818161016e01526101dd0152610a606000f3fe608060405234801561001057600080fd5b506004361061006d5760003560e01c80631311163c146100725780632986c0e5146100875780633594b762146100a357806335c1d349146100ac578063421f9e34146100d7578063467ad0e9146100fe578063e90dd9e214610111575b600080fd5b6100856100803660046108f3565b61011a565b005b61009060015481565b6040519081526020015b60405180910390f35b61009060025481565b6100bf6100ba366004610935565b6101aa565b6040516001600160a01b03909116815260200161009a565b6100907f000000000000000000000000000000000000000000000000000000000000000081565b61008561010c366004610935565b6101ca565b61009060005481565b600254813515801561012a575080155b1561013757426002555050565b610140826104e3565b156101a657806101685760808201351561015957426002555b50803560015560800135600055565b426101937f000000000000000000000000000000000000000000000000000000000000000083610964565b106101a657813560015560808201356000555b5050565b600381600581106101ba57600080fd5b01546001600160a01b0316905081565b60025480158015906102045750426102027f000000000000000000000000000000000000000000000000000000000000000083610964565b105b61024a5760405162461bcd60e51b81526020600482015260126024820152714e6f20656c6170736564206469737075746560701b60448201526064015b60405180910390fd5b6000546003600001546001600160a01b031633148015610268575082155b80156102775750806001166001145b1561028857600119166002176104bd565b6003600401546001600160a01b0316331480156102a55750826001145b80156102b45750806002166002145b156102c55760021916600c176104bd565b6003600101546001600160a01b0316331480156102e25750826002145b80156102f15750806004166004145b1561030257600419166010176104bd565b6003600101546001600160a01b03163314801561031f5750826003145b801561032e5750806008166008145b1561033f57600819166020176104bd565b60038001546001600160a01b03163314801561035b5750826004145b801561036a5750806040166040145b1561037b57604019166080176104bd565b6003600201546001600160a01b0316331480156103985750826005145b80156103a75750806080166080145b156103b95760801916610100176104bd565b6003600201546001600160a01b0316331480156103d65750826006145b80156103e757508061010016610100145b156103fa576101001916610200176104bd565b60038001546001600160a01b0316331480156104165750826007145b801561042757508061020016610200145b1561043a576102001916610400176104bd565b6003600401546001600160a01b0316331480156104575750826008145b801561046857508061040016610400145b1561047b576104001916610800176104bd565b6003600401546001600160a01b0316331480156104985750826009145b80156104a957508061080016610800145b156104b85761080019166104bd565b505050565b5b80156104dc5780603016603014156104dc57603019166040176104be565b6000555050565b60008160000135600154106104fa57506000919050565b604080518335602082810191909152840135818301529083013560608281019190915283013560808281019190915283013560a08281019190915283013560c082015260009060e00160405160208183030381529060405280519060200120905060005b6005811015610626576003816005811061057a5761057a61097c565b01546001600160a01b03166105fc61059560c0870187610992565b83600581106105a6576105a661097c565b6020028101906105b691906109b2565b8080601f0160208091040260200160405190810160405280939291908181526020018383808284376000920191909152506105f692508791506106309050565b90610683565b6001600160a01b031614610614575060009392505050565b8061061e816109f9565b91505061055e565b5060019392505050565b6040517f19457468657265756d205369676e6564204d6573736167653a0a3332000000006020820152603c8101829052600090605c01604051602081830303815290604052805190602001209050919050565b600080600061069285856106a7565b9150915061069f816106ed565b509392505050565b6000808251604114156106de5760208301516040840151606085015160001a6106d287828585610839565b945094505050506106e6565b506000905060025b9250929050565b600081600481111561070157610701610a14565b141561070a5750565b600181600481111561071e5761071e610a14565b14156107675760405162461bcd60e51b815260206004820152601860248201527745434453413a20696e76616c6964207369676e617475726560401b6044820152606401610241565b600281600481111561077b5761077b610a14565b14156107c95760405162461bcd60e51b815260206004820152601f60248201527f45434453413a20696e76616c6964207369676e6174757265206c656e677468006044820152606401610241565b60038160048111156107dd576107dd610a14565b14156108365760405162461bcd60e51b815260206004820152602260248201527f45434453413a20696e76616c6964207369676e6174757265202773272076616c604482015261756560f01b6064820152608401610241565b50565b6000806fa2a8918ca85bafe22016d0b997e4df60600160ff1b0383111561086657506000905060036108ea565b6040805160008082526020820180845289905260ff881692820192909252606081018690526080810185905260019060a0016020604051602081039080840390855afa1580156108ba573d6000803e3d6000fd5b5050604051601f1901519150506001600160a01b0381166108e3576000600192509250506108ea565b9150600090505b94509492505050565b60006020828403121561090557600080fd5b813567ffffffffffffffff81111561091c57600080fd5b820160e0818503121561092e57600080fd5b9392505050565b60006020828403121561094757600080fd5b5035919050565b634e487b7160e01b600052601160045260246000fd5b600082198211156109775761097761094e565b500190565b634e487b7160e01b600052603260045260246000fd5b60008235609e198336030181126109a857600080fd5b9190910192915050565b6000808335601e198436030181126109c957600080fd5b83018035915067ffffffffffffffff8211156109e457600080fd5b6020019150368190038213156106e657600080fd5b6000600019821415610a0d57610a0d61094e565b5060010190565b634e487b7160e01b600052602160045260246000fdfea26469706673582212205b23a6040114b460fe7b351ee86e834ce9392586ca277f0b2da77ceec544525064736f6c63430008090033";

type SC_ProcessChannelConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: SC_ProcessChannelConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class SC_ProcessChannel__factory extends ContractFactory {
  constructor(...args: SC_ProcessChannelConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override deploy(
    _participants: [
      PromiseOrValue<string>,
      PromiseOrValue<string>,
      PromiseOrValue<string>,
      PromiseOrValue<string>,
      PromiseOrValue<string>
    ],
    _disputeWindowInUNIX: PromiseOrValue<BigNumberish>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<SC_ProcessChannel> {
    return super.deploy(
      _participants,
      _disputeWindowInUNIX,
      overrides || {}
    ) as Promise<SC_ProcessChannel>;
  }
  override getDeployTransaction(
    _participants: [
      PromiseOrValue<string>,
      PromiseOrValue<string>,
      PromiseOrValue<string>,
      PromiseOrValue<string>,
      PromiseOrValue<string>
    ],
    _disputeWindowInUNIX: PromiseOrValue<BigNumberish>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(
      _participants,
      _disputeWindowInUNIX,
      overrides || {}
    );
  }
  override attach(address: string): SC_ProcessChannel {
    return super.attach(address) as SC_ProcessChannel;
  }
  override connect(signer: Signer): SC_ProcessChannel__factory {
    return super.connect(signer) as SC_ProcessChannel__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): SC_ProcessChannelInterface {
    return new utils.Interface(_abi) as SC_ProcessChannelInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): SC_ProcessChannel {
    return new Contract(address, _abi, signerOrProvider) as SC_ProcessChannel;
  }
}
