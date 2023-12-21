"use client";

import { useAccount } from "wagmi";
import { readContract } from "@wagmi/core";
import { useState, useEffect } from "react";
import { abi, contractAddress, maxWhitelist, maxPublic } from "@/constants";
import { Spinner, Flex, Text } from "@chakra-ui/react";
//import WhitelistMint from "@/components/WhitelistMint";

export default function Home() {

  const { address, isConnected } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState();
  const [saleStartTime, setSaleStartTime] = useState();
  const [totalSupply, setTotalSupply] = useState();

  const getDatas = async() => {
    try{
      setIsLoading(true);
      // Récupérer les données
      const step = await readContract({
        address: contractAddress,
        abi: abi,
        functionName: "getStep",
        account: address
      });

      const saleStartTime = await readContract({
        address: contractAddress,
        abi: abi,
        functionName: "saleStartTime",
        account: address
      });

      const totalSupply = await readContract({
        address: contractAddress,
        abi: abi,
        functionName: "totalSupply",
        account: address
      });

      setStep(step);
      setSaleStartTime(Number(saleStartTime));
      setTotalSupply(Number(totalSupply));
      setIsLoading(false);
    }
    catch(e){
      console.log(e.message);
    }
  }

  useEffect(() => {
    const getInfos = async() => {
      if(!isConnected) return;
      const datas = await getDatas();
    }
    getInfos();
  }, [address]);

  return (
    <>
      <Flex justifyContent="center" alignItems="center">
        {isLoading ? (
          <Spinner />
        ) : (
          isConnected ? (
            <>
              {(() => {
                switch(step){
                  case 0:
                    return <Before saleStartTime={saleStartTime} getDatas={getDatas} />
                  case 1:
                    return <WhitelistMint getDatas={getDatas} totalSupply={totalSupply} maxWhitelist={maxWhitelist} />
                  case 2:
                    return <Between saleStartTime={saleStartTime + 24 * 3600 + 12} getDatas={getDatas} />
                  case 3:
                    return <PublicMint getDatas={getDatas} totalSupply={totalSupply} maxPublic={maxPublic + maxWhitelist} />
                  case 4:
                    return <Finished getDatas={getDatas} revealStartTime={saleStartTime + 216 * 3600 + 12} />
                  case 5:
                    return <Reveal />
                  default:
                    return <Text>An error occured</Text>
                }
              })()}
            </>
          ) : (
            <Text>Please connect your Wallet.</Text>
          )
        )}
      </Flex>
    </>
  )
}
