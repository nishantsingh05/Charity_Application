import { contractAddresses, abi } from "../constants";
// dont export from moralis when using react
import { useMoralis, useWeb3Contract } from "react-moralis";
import { useEffect, useState } from "react";
import { useNotification } from "web3uikit";
import { ethers } from "ethers";

export default function Donate() {
  const { Moralis, isWeb3Enabled, chainId: chainIdHex } = useMoralis();
  const [value, setValue] = useState(0.1); // These get re-rendered every time due to our connect button!
  const chainId = parseInt(chainIdHex);
  const charityAddress =
    chainId in contractAddresses ? contractAddresses[chainId][0] : null;

  const [MinimumUSD, setMinimumUSD] = useState("0");
  const [DonationInContract, setDonationInContract] = useState("0");

  const dispatch = useNotification();

  const {
    runContractFunction: Donate,
    data: enterTxResponse,
    isLoading,
    isFetching,
  } = useWeb3Contract({
    abi: abi,
    contractAddress: charityAddress,
    functionName: "Donate",
    msgValue: Number(value * 1e18).toString(),
    params: {},
  });

  /* View Functions */

  const { runContractFunction: getbalance } = useWeb3Contract({
    abi: abi,
    contractAddress: charityAddress, // specify the networkId
    functionName: "getbalance",
    params: {},
  });
  const { runContractFunction: getMinDonationValue } = useWeb3Contract({
    abi: abi,
    contractAddress: charityAddress, // specify the networkId
    functionName: "getMinDonationValue",
    params: {},
  });

  async function updateUIValues() {
    const minusd = (await getMinDonationValue()).toString();
    const balance = (await getbalance()).toString();

    setMinimumUSD(minusd);
    setDonationInContract(balance);
  }

  useEffect(() => {
    if (isWeb3Enabled) {
      updateUIValues();
    }
  }, [isWeb3Enabled]);

  const handleNewNotification = () => {
    dispatch({
      type: "info",
      message: "Transaction Complete!",
      title: "Transaction Notification",
      position: "topR",
      icon: "bell",
    });
  };

  const handleSuccess = async (tx) => {
    await tx.wait(1);
    updateUIValues();
    handleNewNotification(tx);
  };

  return (
    <div className="p-5">
      {charityAddress ? (
        <>
          <h1 className="py-4 px-4 font-bold text-3xl">Donate</h1>
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-auto"
            onClick={async () =>
              await Donate({
                onSuccess: handleSuccess,
                onError: (error) => console.log(error),
              })
            }
            disabled={isLoading || isFetching}
          >
            {isLoading || isFetching ? (
              <div className="animate-spin spinner-border h-8 w-8 border-b-2 rounded-full"></div>
            ) : (
              "Donate"
            )}
          </button>
          <input
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.currentTarget.value);
            }}
          />
          <div>Minimum Donation Amount: {MinimumUSD} USD</div>
          <div>Total Amount In Smart Contract: {DonationInContract}</div>
        </>
      ) : (
        <div>Please connect to a supported chain </div>
      )}
    </div>
  );
}
