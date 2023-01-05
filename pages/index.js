import { TextField } from "@mui/material";
import { Button } from "@mui/material";
import { useState, useEffect } from "react";
import abi from "./utils/FavoriteNumber.json";
import { ethers } from "ethers";

const getEthereumObject = () => window.ethereum;

const findMetaMaskAccount = async () => {
  try {
    const ethereum = getEthereumObject();

    if (!ethereum) {
      alert("Make sure you have Metamask!");
      return null;
    }

    const accounts = await ethereum.request({ method: "eth_accounts" });

    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account:", account);
      return account;
    } else {
      console.error("No authorized account found");
      return null;
    }
  } catch (error) {
    console.error(error);
    return null;
  }
};

export default function Home() {
  const contractAddress = "0xD61F58d715649C757cAD38824A18fb5C56bc0613";
  const [currentAccount, setCurrentAccount] = useState("");
  const [status, setStatus] = useState("");
  const [people, setPeople] = useState([]);
  const [userFavoriteNumber, setUserFavoriteNumber] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    number: "",
    nameToNumber: "",
  });
  const contractABI = abi.abi;

  // handles change on forms. placing the form information in formData
  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((prevData) => {
      return {
        ...prevData,
        [name]: value,
      };
    });
  }

  //this function calls function getAllPeople from the smart contract
  const getAllNumbers = async () => {
    const { ethereum } = window;

    try {
      if (ethereum) {
        //checking if the user is on Polygon mainnet
        if (window.ethereum.chainId !== "0x89") {
          alert("Switch to Seoplia testnet to use this function.");
          return;
        }
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const favoriteNumberContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );
        const userNumbers = await favoriteNumberContract.getAllPeople();

        // mapping userNumbers to get the event from the smart contract to get msg.sender/block.timestamp/_name/_favoriteNumber and placing them in people state
        const mappedUserNumbers = userNumbers.map((userInfo) => {
          return {
            address: userInfo.numberKeeper,
            timestamp: new Date(userInfo.timestamp * 1000),
            name: userInfo.name,
            favoriteNumber: userInfo.favoriteNumber.toNumber(),
          };
        });
        setPeople(mappedUserNumbers);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  //this function calls function getNameToFavoriteNumber from the smart contract which returns a mapping (string => uint256)/ name to favorite number
  const nameToFavoriteNumber = async () => {
    try {
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const favoriteNumberContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );
        const nameToFavoriteNumber =
          await favoriteNumberContract.getNameToFavoriteNumber(
            formData.nameToNumber
          );
        setUserFavoriteNumber(nameToFavoriteNumber.toNumber());
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  //this function calls function addPerson from the smart contract which stores in struct of Person into array of people. in arguments it takes name and favoritenumber
  const storePerson = async () => {
    try {
      const { ethereum } = window;
      //checking if the user is on Polygon mainnet
      if (window.ethereum.chainId !== "0x89") {
        alert("Switch to Polygon mainnet to use this function.");
        return;
      }
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const favoriteNumberContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );
        const storePerson = await favoriteNumberContract.addPerson(
          formData.number,
          formData.name
        );
        setStatus("Mining...");
        await storePerson.wait();

        console.log("Mined -- ", storePerson.hash);
        setStatus("Mined -- ");
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Metamask connect function
  const connectWallet = async () => {
    try {
      const ethereum = getEthereumObject();
      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.error(error);
    }
  };

  const getAccount = async () => {
    const account = await findMetaMaskAccount();
    if (account !== null) {
      setCurrentAccount(account);
    }
  };

  useEffect(() => {
    getAccount();
  }, [currentAccount]);

  return (
    <div className="mainContentContainer">
      <div className="connectMetamask">
        {!currentAccount && (
          <Button variant="contained" onClick={connectWallet}>
            Connect with Metamask
          </Button>
        )}
      </div>
      <br></br>
      <div className="mainContent">
        <p style={{ marginRight: "auto" }}>
          Hey my name is David and I have built this Dapp.
          <br></br>
          You can store your name and favorite number on the blockchain which is
          currently hosted on Polygon mainnet.
          <br></br>
          {currentAccount && (
            <span>
              I see you have connected with this account: {currentAccount}
            </span>
          )}
        </p>
      </div>
      <div className="inputFieldDivs">
        <div className="inputFieldsFirst">
          <p>
            Hello dear {formData.name} as it seems your favorite number is:{" "}
            {formData.number} <br></br>
            if you want to store this number on the blockchain click on STORE
            button.
          </p>
          <TextField
            id="outlined-basic"
            label="Name"
            variant="outlined"
            onChange={handleChange}
            value={formData.name}
            name="name"
          />
          <TextField
            id="outlined-basic"
            label="Favorite Number"
            variant="outlined"
            onChange={handleChange}
            value={formData.number}
            name="number"
          />
          <Button variant="contained" onClick={storePerson}>
            STORE
          </Button>

          <Button variant="contained" onClick={getAllNumbers}>
            get All Numbers
          </Button>

          <div>
            <p>{status}</p>
            {people.map((userInfo, index) => {
              return (
                <div
                  key={index}
                  style={{
                    backgroundColor: "OldLace",
                    marginTop: "16px",
                    padding: "8px",
                  }}
                >
                  <div>Address: {userInfo.address}</div>
                  <div>Time: {userInfo.timestamp.toString()}</div>
                  <div>Name: {userInfo.name}</div>
                  <div>Favorite Number: {userInfo.favoriteNumber}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="inputFieldsSecond">
          <p>
            If you want to retrieve your favorite number from the blockchain,
            type in your name and click on GET FAVORITE NUMBER
          </p>
          <TextField
            id="outlined-basic"
            label="Name"
            variant="outlined"
            name="nameToNumber"
            onChange={handleChange}
            value={formData.nameToNumber}
          />
          <Button variant="contained" onClick={nameToFavoriteNumber}>
            get favorite number
          </Button>
          <p>
            {userFavoriteNumber && (
              <span>
                As it seems for {formData.nameToNumber} favorite number is :{" "}
                {userFavoriteNumber}
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
