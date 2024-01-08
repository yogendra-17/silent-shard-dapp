import "./App.css";
import "react-toastify/dist/ReactToastify.css";

import { KeyringAccount } from "@metamask/keyring-api";
import { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";

import {
  ACCOUNT_CREATION_REJECTED_TOAST_MSG,
  APPROVAL_TIMEOUT_ERR_MSG,
  CONNECTION_REJECTED_TOAST_MSG,
  LOST_INTERNET_TOAST_MSG,
  SnapError,
  UNKNOWN_ERR_TOAST_MSG,
  WRONG_SECRET_KEY_ERR_MSG,
  WRONG_SECRET_KEY_TOAST_MSG,
} from "./api/error";
import { checkMetaMaskInstallation } from "./api/metamask";
import {
  connect,
  getKeyringClient,
  initPairing,
  isConnected,
  isPaired,
  runKeygen,
  runPairing,
  snapVersion,
  unPair,
} from "./api/snap";
import LogoSvg from "./components/LogoSvg";
import Spinner from "./components/Spinner";
import { ErrorToast } from "./components/Toast/error";
import { Button } from "./components/ui/button";
import { Dialog, DialogContent } from "./components/ui/dialog";
import Homescreen from "./screens/Homescreen";
import AccountCreation from "./screens/steps/AccountCreation";
import AccountCreationRetry from "./screens/steps/AccountCreationRetry";
import BackupRecovery from "./screens/steps/BackupRecovery";
import Installation from "./screens/steps/Installation";
import Pairing from "./screens/steps/Pairing";
import { compareVersions } from "./utils/metamask";

const App = () => {
  const [isMobileWidthSize, setIsMobileWidthSize] = useState(false);
  const client = getKeyringClient();
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [qr, setQr] = useState<string | null>(null);
  const [seconds, setSeconds] = useState<number>(0);
  const [pairingStatus, setPairingStatus] =
    useState<PairingStatusType>("Unpaired");
  const [account, setAccount] = useState<KeyringAccount | null>(null);
  const [currentSnapVersion, setCurrentSnapVersion] = useState<string | null>(
    null
  );
  const [latestSnapVersion, setLatestSnapVersion] = useState<string | null>(
    null
  );
  const [currentMetaMaskVersion, setCurrentMetaMaskVersion] = useState<
    string | null
  >(null);
  const [leastSupportedMetaMaskVersion, setLeastSupportedMetaMaskVersion] =
    useState<string | null>(null);
  const [deviceOS, setDeviceOS] = useState<string>("ios");
  const [openInstallDialog, setOpenInstallDialog] = useState(false);
  const [openMmConnectDialog, setOpenMmConnectDialog] = useState(false);

  const handleOpenMetaMaskCIExtension = () => {
    const userAgent = window.navigator.userAgent;
    if (userAgent.includes("Firefox")) {
      window.open("https://metamask.io/flask/", "_blank");
    } else {
      window.open("https://metamask.io/flask/", "_blank");
    }
  };

  const handleSnapErrorTemplate = (
    snapErr: SnapError,
    middleHandler?: () => void
  ) => {
    const { code, message } = snapErr;
    if (code === 4100) {
      setCurrentStep(0);
      throw new Error("Please connect to snap");
    }

    if (middleHandler) {
      middleHandler();
    }

    if (code === -1) return;
    if (code !== 0 && message) throw new Error(message);
  };

  const handleMetaMaskConnect = async () => {
    try {
      const {
        isMetaMaskInstalled,
        currentMetaMaskVersion,
        leastSupportedMetaMaskVersion,
      } = await checkMetaMaskInstallation(() => {
        setOpenInstallDialog(true);
      });

      if (!isMetaMaskInstalled) {
        handleOpenMetaMaskCIExtension();
        return;
      }
      const isVersionDeprecated =
        compareVersions(
          leastSupportedMetaMaskVersion!,
          currentMetaMaskVersion!
        ) > 0;

      if (isVersionDeprecated) {
        handleOpenMetaMaskCIExtension();
        return;
      }
      await connect(latestSnapVersion);
      const snapVersionRes = await snapVersion();
      if (snapVersionRes.response) {
        setCurrentSnapVersion(snapVersionRes.response.currentVersion);
        setLatestSnapVersion(snapVersionRes.response.latestVersion);
      }
    } catch (error: unknown) {
      setOpenMmConnectDialog(false);
      if (error instanceof Error) {
        console.error(error.message);
      } else {
        const rpcError = error as ProviderRpcError;
        if (rpcError.code === 4001)
          toast(<ErrorToast msg={CONNECTION_REJECTED_TOAST_MSG} />);
      }
    }
  };

  const handleInstallation = async () => {
    try {
      await handleMetaMaskConnect();

      if (await isConnected()) {
        await handlePairing();
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message);
      } else {
        const rpcError = error as ProviderRpcError;
        if (rpcError.code === 4001)
          toast(<ErrorToast msg={CONNECTION_REJECTED_TOAST_MSG} />);
      }
    }
  };

  const handlePairing = async () => {
    setOpenMmConnectDialog(true);
    try {
      if (pairingStatus !== "Unpaired") return;
      setPairingStatus("Pairing");
      const accounts = await client.listAccounts();
      if (accounts.length > 0) {
        const isPairedRes = await isPaired();
        if (isPairedRes.response?.isPaired) {
          setPairingStatus("Paired");
          setAccount(accounts[0]);
          setCurrentStep(3);
          return;
        } else {
          accounts.forEach(async (a) => {
            try {
              await client.deleteAccount(a.id);
            } catch (error) {
              console.error(error);
            }
          });
        }
      }

      const initPairingRes = await initPairing();
      if (initPairingRes.snapErr && initPairingRes.response === null) {
        const { code } = initPairingRes.snapErr;
        handleSnapErrorTemplate(initPairingRes.snapErr, () => {
          if (code === 4) {
            setCurrentStep(3);
          }
        });
      } else if (initPairingRes.response) {
        setCurrentStep(1);
        setOpenMmConnectDialog(false);
        setQr(initPairingRes.response.qrCode);
        setSeconds(30);
      }

      const runPairingRes = await runPairing();
      if (runPairingRes.snapErr && runPairingRes.response === null) {
        const { code } = runPairingRes.snapErr;
        handleSnapErrorTemplate(runPairingRes.snapErr, () => {
          if (code === 17) {
            setCurrentStep(0);
            throw new SnapError("Backup data is invalid", code);
          }
        });
      }

      setPairingStatus("Paired");
      if (runPairingRes.response?.deviceName) {
        try {
          const deviceOS = runPairingRes.response?.deviceName
            .split(":")[1]
            .split(",")[0]
            .trim();
          setDeviceOS(deviceOS);
        } catch (error) {
          console.error(
            "Error while getting device OS from deviceName:",
            error
          );
        }
      }
      if (runPairingRes.response?.address) {
        setLoading(false);
        setPairingStatus("KeygenDone");
        await handleCreateAccount();
      } else if (runPairingRes.response) {
        const runKeygenRes = await runKeygen();
        if (runKeygenRes.snapErr && runKeygenRes.response === null) {
          handleSnapErrorTemplate(runKeygenRes.snapErr);
        } else if (runKeygenRes.response) {
          setPairingStatus("KeygenDone");
          setLoading(false);
          await handleCreateAccount();
        }
      } else {
        throw new Error(`Pairing failed`);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.message === WRONG_SECRET_KEY_ERR_MSG) {
          toast(<ErrorToast msg={WRONG_SECRET_KEY_TOAST_MSG} />);
        } else if (error.message === APPROVAL_TIMEOUT_ERR_MSG) {
          console.error(error.message);
        } else {
          console.error(error.message);
          toast(<ErrorToast msg={UNKNOWN_ERR_TOAST_MSG} />);
        }
      }
      setPairingStatus("Unpaired");
      setSeconds(0);
      setOpenMmConnectDialog(false);
    }
  };

  const handleCreateAccount = async () => {
    if (!(await isConnected())) {
      await handleMetaMaskConnect();
    }
    try {
      if (pairingStatus === "AccountCreationInProgress") return;
      setPairingStatus("AccountCreationInProgress");
      const account = await client.createAccount();
      setAccount(account);
      setPairingStatus("AccountCreated");
      setCurrentStep(2);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(error.message);
        toast(<ErrorToast msg={UNKNOWN_ERR_TOAST_MSG} />);
      } else {
        const rpcError = error as ProviderRpcError;
        if (rpcError.code === -32600) {
          console.error("Disconnected from Silent Shard. Need to reconnect.");
        } else {
          try {
            const snapErr = JSON.parse(rpcError.message);
            if (snapErr.code === 14) {
              toast(<ErrorToast msg={ACCOUNT_CREATION_REJECTED_TOAST_MSG} />);
            }
          } catch (error: unknown) {
            toast(<ErrorToast msg={UNKNOWN_ERR_TOAST_MSG} />);
          }
        }
      }
      setPairingStatus("AccountCreationDenied");
      setSeconds(0);
    }
  };

  const handleMetaMaskInstallation = async () => {
    const { isMetaMaskInstalled } = await checkMetaMaskInstallation(() => {
      setOpenInstallDialog(true);
    });
    if (!isMetaMaskInstalled) {
      setOpenInstallDialog(true);
    }
  };

  const handleSnapVersion = async () => {
    const snapVersionRes = await snapVersion();
    setCurrentSnapVersion(snapVersionRes.response?.currentVersion ?? null);
    setLatestSnapVersion(snapVersionRes.response?.latestVersion ?? null);
    return snapVersionRes;
  };

  const handleSnapState = async () => {
    const {
      currentMetaMaskVersion: tempCurrentMetaMaskVersion,
      leastSupportedMetaMaskVersion: tempLeastSupportedMetaMaskVersion,
    } = await checkMetaMaskInstallation(() => {
      setOpenInstallDialog(true);
    });

    if (
      tempCurrentMetaMaskVersion &&
      tempCurrentMetaMaskVersion !== currentMetaMaskVersion
    ) {
      setCurrentMetaMaskVersion(tempCurrentMetaMaskVersion);
    }
    if (
      tempLeastSupportedMetaMaskVersion &&
      tempLeastSupportedMetaMaskVersion !== leastSupportedMetaMaskVersion
    ) {
      setLeastSupportedMetaMaskVersion(tempLeastSupportedMetaMaskVersion);
    }

    const snapVersionRes = await handleSnapVersion();

    if (pairingStatus === "Unpairing") return;

    try {
      if (await isConnected()) {
        const isPairedRes = await isPaired();
        if (isPairedRes.response?.isPaired) {
          const accounts = await client.listAccounts();
          if (accounts.length === 0) {
            if (isPairedRes.response.isAccountExist) {
              setCurrentStep(1);
              setPairingStatus("AccountCreationDenied");
            } else {
              handleReset();
            }
          } else {
            setAccount(accounts[0]);
            setCurrentStep(3);
          }
        } else if (
          snapVersionRes.response?.currentVersion ===
          snapVersionRes.response?.latestVersion
        ) {
          setCurrentStep(0);
        }
      }
      setLoading(false);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (window.innerWidth < 640) {
      setIsMobileWidthSize(true);
    }

    const handleLostInternetConnection = () => {
      toast(<ErrorToast msg={LOST_INTERNET_TOAST_MSG} />);
    };

    handleMetaMaskInstallation();
    handleSnapState();

    window.addEventListener("offline", handleLostInternetConnection);
    return () => {
      window.removeEventListener("offline", handleLostInternetConnection);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        handleMetaMaskInstallation();
        if (openInstallDialog) {
          window.location.reload();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [openInstallDialog]);

  useEffect(() => {
    if (
      pairingStatus !== "Pairing" &&
      pairingStatus !== "Unpairing" &&
      pairingStatus !== "Unpaired"
    ) {
      setSeconds(0);
      return;
    }
    if (seconds === 0) setPairingStatus("Unpaired");

    if (!seconds) {
      setQr(null);
      return;
    }
    if (seconds > 0) {
      const intervalId = setInterval(() => {
        setSeconds(seconds - 1);
      }, 1000);

      return () => clearInterval(intervalId);
    }
  }, [seconds, pairingStatus]);

  useEffect(() => {
    (async () => {
      if (currentStep === 2) {
        if (!(await isPaired()).response?.isPaired) setCurrentStep(1);
      }
      if (currentStep > 1) {
        setOpenMmConnectDialog(false);
      }
    })();
  }, [currentStep]);

  const handleReset = () => {
    setQr(null);
    setPairingStatus("Unpaired");
    setSeconds(0);
    setCurrentStep(0);
    setAccount(null);
  };

  const handleBackwardPairingScreen = async () => {
    handleReset();
    if (await isConnected()) {
      await unPair();
    }
  };

  const handleBackwardAccountCreationScreen = async () => {
    if (await isConnected()) {
      setCurrentStep(currentStep - 1);
    } else {
      handleReset();
    }
  };

  if (loading)
    return (
      <div className="app-container" style={{ justifyContent: "center" }}>
        <Spinner />
      </div>
    );

  return (
    <div className="app-container">
      {/* Navigator */}
      <nav className="w-full z-20 top-0 start-0 border-b border-gray-700 bg-black mb-6">
        <div className="max-w-screen-xl flex flex-wrap items-center justify-between h-[8.88vh]">
          <LogoSvg
            className={`h-auto ${
              !isMobileWidthSize ? "ml-40 w-[6.4vw]" : "ml-4 w-[25vw]"
            }`}
          />
        </div>
      </nav>
      <img className="bg-pattern-2nd-layer" src="/v2/pattern.png" alt=""></img>

      {/* Body */}
      {currentStep === 3 &&
      currentSnapVersion &&
      latestSnapVersion &&
      account ? (
        <div className="flex flex-col flex-1 bg-pattern">
          <Homescreen
            onLogout={handleReset}
            isUpateAvailabe={
              latestSnapVersion && currentMetaMaskVersion
                ? compareVersions(latestSnapVersion, currentMetaMaskVersion) > 0
                : false
            }
            currentSnapVersion={currentSnapVersion}
            latestSnapVersion={latestSnapVersion}
            account={account!}
          />
          <div className="text-white-primary full-w flex mt-auto justify-end mr-14 mb-6 label-regular z-50">
            Snap version: {currentSnapVersion}
          </div>
        </div>
      ) : (
        <div className="w-full relative bg-pattern" style={{ zIndex: 1 }}>
          <img
            className="bg-pattern-2nd-layer -z-10"
            src="/v2/pattern.png"
            alt=""
          ></img>
          {currentStep === 0 && (
            <Installation
              isMobileWidthSize={isMobileWidthSize}
              handleConnect={async () => {
                setOpenMmConnectDialog(true);
                await handleInstallation();
              }}
            />
          )}

          {currentStep === 1 && (
            <>
              {pairingStatus === "KeygenDone" ||
              pairingStatus === "AccountCreationInProgress" ? (
                <AccountCreation
                  step={{
                    progressStep: currentStep + 1,
                    onGoingBackClick: handleBackwardAccountCreationScreen,
                  }}
                  disableBackward={
                    pairingStatus === "KeygenDone" ||
                    pairingStatus === "AccountCreationInProgress"
                  }
                />
              ) : pairingStatus === "AccountCreationDenied" ? (
                <AccountCreationRetry
                  handleCreateAccount={handleCreateAccount}
                  step={{
                    progressStep: currentStep,
                    onGoingBackClick: () => {
                      handleReset();
                    },
                  }}
                />
              ) : (
                <Pairing
                  qr={qr}
                  seconds={seconds}
                  handlePairing={handlePairing}
                  loading={pairingStatus === "Paired"}
                  step={{
                    progressStep: currentStep,
                    onGoingBackClick: handleBackwardPairingScreen,
                  }}
                />
              )}
            </>
          )}

          {pairingStatus === "AccountCreated" && currentStep === 2 && (
            <BackupRecovery
              onDone={() => {
                setCurrentStep(3);
              }}
              step={{
                progressStep: currentStep + 1,
              }}
              deviceOS={deviceOS}
            />
          )}
        </div>
      )}

      {/* Dialogs */}
      {!isMobileWidthSize && (
        <Dialog open={openInstallDialog} onOpenChange={setOpenInstallDialog}>
          <DialogContent className="flex flex-col items-center justify-center py-16 px-10 bg-[#121212] border-none outline-none w-[49.5vw]">
            <img
              src="/v2/mmfox.svg"
              alt="mmfox"
              style={{ width: 156, height: 156 }}
            />
            <div className="my-10 text-center h2-bold text-white-primary">
              Install MetaMask extension!
            </div>
            <div
              className="mt-2 text-center b1-regular"
              style={{ color: "#EDEEF1" }}
            >
              Looks like you don’t have MetaMask extension. To start using
              Snaps, you&apos;ll need the MetaMask extension for your browser
            </div>
            <Button
              className="bg-indigo-primary hover:bg-indigo-hover active:bg-indigo-active w-full self-center mt-8 text-white-primary btn-lg"
              onClick={handleOpenMetaMaskCIExtension}
            >
              Get MetaMask
            </Button>
          </DialogContent>
        </Dialog>
      )}

      {isMobileWidthSize && (
        <Dialog defaultOpen={true}>
          <DialogContent className="flex flex-col items-center justify-center py-14 px-4 bg-[#121212] border-none outline-none w-[92vw]">
            <img
              src="/v2/warn.png"
              alt="warn"
              style={{ width: 204, height: 133 }}
            />
            <div className="mt-6 text-center text-white-primary h2-md">
              Uh-oh! Device not supported
            </div>
            <div
              className="mt-2 text-center b2-regular"
              style={{ color: "#D8DBDF" }}
            >
              This website requires you to connect to your metamask extension.
              Please view it on a{" "}
              <span className="b2-bold">Desktop Browser</span>.
            </div>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={openMmConnectDialog} onOpenChange={setOpenMmConnectDialog}>
        <DialogContent
          className="flex flex-col items-center justify-center py-14 px-24 w-[36.72vw] h-auto bg-[#121212] border-none outline-none"
          onInteractOutside={(e) => {
            e.preventDefault();
          }}
        >
          <img src="/v2/mmfox-approve.svg" alt="mmfox-approve" />
          <div
            className="mt-2 text-center text-white-primary"
            style={{ fontSize: 16, fontWeight: 500 }}
          >
            Approve on MetaMask to continue
          </div>
        </DialogContent>
      </Dialog>

      <ToastContainer
        hideProgressBar
        icon={false}
        closeButton={false}
        toastClassName={() => ""}
        bodyClassName={() => ""}
      />
    </div>
  );
};

export default App;
