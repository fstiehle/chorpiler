/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumber,
  BigNumberish,
  BytesLike,
  CallOverrides,
  ContractTransaction,
  Overrides,
  PopulatedTransaction,
  Signer,
  utils,
} from "ethers";
import type { FunctionFragment, Result } from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type {
  TypedEventFilter,
  TypedEvent,
  TypedListener,
  OnEvent,
  PromiseOrValue,
} from "./common";

export interface IM_ProcessExecutionInterface extends utils.Interface {
  functions: {
    "enact(uint256,uint256)": FunctionFragment;
    "participants(uint256)": FunctionFragment;
    "tokenState()": FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic: "enact" | "participants" | "tokenState"
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: "enact",
    values: [PromiseOrValue<BigNumberish>, PromiseOrValue<BigNumberish>]
  ): string;
  encodeFunctionData(
    functionFragment: "participants",
    values: [PromiseOrValue<BigNumberish>]
  ): string;
  encodeFunctionData(
    functionFragment: "tokenState",
    values?: undefined
  ): string;

  decodeFunctionResult(functionFragment: "enact", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "participants",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "tokenState", data: BytesLike): Result;

  events: {};
}

export interface IM_ProcessExecution extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: IM_ProcessExecutionInterface;

  queryFilter<TEvent extends TypedEvent>(
    event: TypedEventFilter<TEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TEvent>>;

  listeners<TEvent extends TypedEvent>(
    eventFilter?: TypedEventFilter<TEvent>
  ): Array<TypedListener<TEvent>>;
  listeners(eventName?: string): Array<Listener>;
  removeAllListeners<TEvent extends TypedEvent>(
    eventFilter: TypedEventFilter<TEvent>
  ): this;
  removeAllListeners(eventName?: string): this;
  off: OnEvent<this>;
  on: OnEvent<this>;
  once: OnEvent<this>;
  removeListener: OnEvent<this>;

  functions: {
    enact(
      id: PromiseOrValue<BigNumberish>,
      cond: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    participants(
      arg0: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<[string]>;

    tokenState(overrides?: CallOverrides): Promise<[BigNumber]>;
  };

  enact(
    id: PromiseOrValue<BigNumberish>,
    cond: PromiseOrValue<BigNumberish>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  participants(
    arg0: PromiseOrValue<BigNumberish>,
    overrides?: CallOverrides
  ): Promise<string>;

  tokenState(overrides?: CallOverrides): Promise<BigNumber>;

  callStatic: {
    enact(
      id: PromiseOrValue<BigNumberish>,
      cond: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<void>;

    participants(
      arg0: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<string>;

    tokenState(overrides?: CallOverrides): Promise<BigNumber>;
  };

  filters: {};

  estimateGas: {
    enact(
      id: PromiseOrValue<BigNumberish>,
      cond: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    participants(
      arg0: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    tokenState(overrides?: CallOverrides): Promise<BigNumber>;
  };

  populateTransaction: {
    enact(
      id: PromiseOrValue<BigNumberish>,
      cond: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    participants(
      arg0: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    tokenState(overrides?: CallOverrides): Promise<PopulatedTransaction>;
  };
}
