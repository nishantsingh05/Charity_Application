import { contractAddresses, abi } from "../constants";
// dont export from moralis when using react
import { useMoralis, useWeb3Contract } from "react-moralis";
import { useEffect, useState } from "react";
import { useNotification } from "web3uikit";
import { ethers } from "ethers";

export default function MoneyRequest() {
  const { Moralis, isWeb3Enabled, chainId: chainIdHex } = useMoralis();
  const [value, setValue] = useState("");
  const chainId = parseInt(chainIdHex);
  const charityAddress =
    chainId in contractAddresses ? contractAddresses[chainId][0] : null;

  const dispatch = useNotification();

  const {
    runContractFunction: MoneyRequest,
    data: enterTxResponse,
    isLoading,
    isFetching,
  } = useWeb3Contract({
    abi: abi,
    contractAddress: charityAddress,
    functionName: "MoneyRequest",
    params: { amount: Number(value * 1e18).toString() },
  });

  const handleNewNotification = () => {
    dispatch({
      type: "info",
      message: "Money Requested Succesfully!",
      title: "Transaction Notification",
      position: "topR",
      icon: "bell",
    });
  };

  const handleSuccess = async (tx) => {
    await tx.wait(1);
    handleNewNotification(tx);
  };

  return (
    <div className="p-5">
      {charityAddress ? (
        <>
          <h1 className="py-4 px-4 font-bold text-3xl">Money Request</h1>
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-auto"
            onClick={async () =>
              await MoneyRequest({
                onSuccess: handleSuccess,
                onError: (error) => console.log(error),
              })
            }
            disabled={isLoading || isFetching}
          >
            {isLoading || isFetching ? (
              <div className="animate-spin spinner-border h-8 w-8 border-b-2 rounded-full"></div>
            ) : (
              "Money Request"
            )}
          </button>
          <input
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.currentTarget.value.toString());
            }}
          />
        </>
      ) : (
        <div></div>
      )}
    </div>
  );
}
