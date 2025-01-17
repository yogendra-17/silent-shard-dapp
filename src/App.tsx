// Copyright (c) Silence Laboratories Pte. Ltd.
// This software is licensed under the Silence Laboratories License Agreement.

import './App.css';
import 'react-toastify/dist/ReactToastify.css';

import { KeyringAccount } from '@metamask/keyring-api';
import { useCallback, useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';

import {
  AnalyticEvent,
  EventName,
  EventStatus,
  EventType,
  REJECTED_ERROR,
  trackAnalyticEvent,
} from './api/analytic';
import {
  ACCOUNT_CREATION_REJECTED_TOAST_MSG,
  BROKEN_DATE_TIME_SETTING_ERR_MSG,
  CANCEL_RESTORATION,
  CONNECTION_REJECTED_TOAST_MSG,
  CONNECTION_REJECTED_UPDATE_SNAP_TOAST_MSG,
  MISSING_PROVIDER_ERR_MSG,
  SnapError,
  UNKNOWN_ERR_TOAST_MSG,
  WRONG_SECRET_KEY_ERR_MSG,
  WRONG_SECRET_KEY_TOAST_MSG,
} from './api/error';
import {
  connectSnap,
  getKeyringClient,
  initPairing,
  isConnected,
  isPaired,
  parseRpcError,
  runKeygen,
  runPairing,
  runRePairing,
  snapVersion,
  unPair,
} from './api/snap';
import NavBar from './components/NavBar';
import Spinner from './components/Spinner';
import { ErrorToast } from './components/Toast/error';
import { Button } from './components/ui/button';
import { Dialog, DialogContent } from './components/ui/dialog';
import { useOfflineStatus } from './hooks/useOfflineStatus';
import AccountCreation from './screens/AccountCreation';
import BackupRecovery from './screens/BackupRecovery';
import ErrorState from './screens/ErrorState';
import Homescreen from './screens/Homescreen';
import Installation from './screens/Installation';
import MismatchRepairing from './screens/MismatchRepairing';
import Pairing from './screens/Pairing';
import { AppState, AppStatus, Callback, DeviceOS, ProviderRpcError, SnapMetaData } from './types';

let provider: EIP1193Provider;
const App = () => {
  const isMobileWidthSize = window.innerWidth < 640;
  useOfflineStatus(); // handle internet disconnection

  const [loading, setLoading] = useState(true);
  const [openInstallDialog, setOpenInstallDialog] = useState(false);
  const [openMmConnectDialog, setOpenMmConnectDialog] = useState(false);
  const [appState, setAppState] = useState<AppState>({ status: AppStatus.Unpaired });
  const [snapMetadata, setSnapMetadata] = useState<SnapMetaData | undefined>();
  const [deviceOS, setDeviceOS] = useState<DeviceOS>(DeviceOS.android);
  const handleSnapErrorTemplate = (snapErr: SnapError, errorHandler?: Callback) => {
    const { code, message } = snapErr;
    if (code === 4100) {
      setAppState({ status: AppStatus.Unpaired });
      throw new Error(UNKNOWN_ERR_TOAST_MSG);
    }

    if (code === -1) {
      console.error('Snap error:', snapErr);
      if (message === MISSING_PROVIDER_ERR_MSG) {
        setOpenInstallDialog(true);
      }
      return;
    }
    if (code !== 0 && message) {
      if (message === WRONG_SECRET_KEY_ERR_MSG) {
        toast(<ErrorToast msg={WRONG_SECRET_KEY_TOAST_MSG} />);
      } else if (code === 1) {
        // Firebase errors
        if (message === BROKEN_DATE_TIME_SETTING_ERR_MSG) {
          toast(<ErrorToast msg={'Please check your date and time settings and try again.'} />);
        } else if (message === 'timeout') {
          return;
        }
      } else if (code === 4) {
        toast(<ErrorToast msg={'Backup data is invalid'} />);
      } else {
        toast(<ErrorToast msg={UNKNOWN_ERR_TOAST_MSG} />);
      }
    }

    if (errorHandler) {
      errorHandler();
    }
  };

  let mmAddress = '';
  const handleMetaMaskConnect = async () => {
    try {
      const addresses: any = await provider?.request({ method: 'eth_requestAccounts' }); // Ask MetaMask to unlock the wallet if the user locked it
      mmAddress = addresses?.[0];
      trackAnalyticEvent(
        EventName.connect_metamask,
        new AnalyticEvent() //
          .setStatus(EventStatus.approved)
          .setMetamaskAddress(mmAddress)
      );
    } catch (error: unknown) {
      setOpenMmConnectDialog(false);
      if (error instanceof SnapError) {
        if (error.code === 4001) {
          toast(<ErrorToast msg={CONNECTION_REJECTED_TOAST_MSG} />); // Connection is rejected
          trackAnalyticEvent(
            EventName.connect_metamask,
            new AnalyticEvent() //
              .setStatus(EventStatus.failed)
              .setMetamaskAddress(mmAddress)
              .setError(REJECTED_ERROR)
          );
        } else {
          handleSnapErrorTemplate(error);
        }
      } else {
        trackAnalyticEvent(
          EventName.connect_metamask,
          new AnalyticEvent() //
            .setStatus(EventStatus.failed)
            .setMetamaskAddress(mmAddress)
            .setError((error as Error).message)
        );
      }
    }
  };

  const handleRequestSnap = async () => {
    try {
      await connectSnap(snapMetadata?.latestSnapVersion || null, provider);
      trackAnalyticEvent(
        EventName.install_snap,
        new AnalyticEvent() //
          .setStatus(EventStatus.approved)
          .setMetamaskAddress(mmAddress)
      );
    } catch (error: unknown) {
      setOpenMmConnectDialog(false);
      if (error instanceof SnapError) {
        if (error.code === 4001) {
          toast(<ErrorToast msg={CONNECTION_REJECTED_TOAST_MSG} />); // Connection is rejected
          trackAnalyticEvent(
            EventName.install_snap,
            new AnalyticEvent() //
              .setStatus(EventStatus.failed)
              .setMetamaskAddress(mmAddress)
              .setError(REJECTED_ERROR)
          );
        } else {
          handleSnapErrorTemplate(error);
        }
      } else {
        trackAnalyticEvent(
          EventName.install_snap,
          new AnalyticEvent() //
            .setStatus(EventStatus.failed)
            .setMetamaskAddress(mmAddress)
            .setError((error as Error).message)
        );
      }
    }
  };

  const handleConnectMmClick = async () => {
    try {
      await handleMetaMaskConnect();
      await handleRequestSnap();
      if (await isConnected(provider)) {
        await handleInitPairing().then((isInitPairingDone) => {
          if (isInitPairingDone) {
            handleRunPairing().then((isPairingDone) => {
              if (isPairingDone) {
                handleCreateAccount();
              }
            });
          }
        });
      }
    } catch (error) {
      if (error instanceof SnapError) {
        handleSnapErrorTemplate(error);
      }
    }
  };

  const handleInitPairing: () => Promise<boolean | undefined> = async () => {
    try {
      setOpenMmConnectDialog(true);
      const accounts = await getKeyringClient(provider)
        .listAccounts()
        .catch((error) => {
          throw new SnapError((error as Error).message, -1);
        });
      if (accounts.length > 0) {
        setAppState({
          status: AppStatus.AccountCreated,
          account: accounts[0],
        });
      }
      const initPairingRes = await initPairing(provider, false);
      trackAnalyticEvent(
        EventName.approve_snap,
        new AnalyticEvent() //
          .setStatus(EventStatus.approved)
          .setMetamaskAddress(mmAddress)
      );
      setAppState({
        status: AppStatus.Pairing,
        qr: initPairingRes.response.qrCode,
        seconds: 30,
      });

      return true;
    } catch (error) {
      if (error instanceof SnapError) {
        if (error.code === 2) {
          // Reject init pairing
          trackAnalyticEvent(
            EventName.approve_snap,
            new AnalyticEvent() //
              .setStatus(EventStatus.failed)
              .setMetamaskAddress(mmAddress)
              .setError(REJECTED_ERROR)
          );
        } else {
          handleSnapErrorTemplate(error);
        }
      } else {
        trackAnalyticEvent(
          EventName.approve_snap,
          new AnalyticEvent() //
            .setStatus(EventStatus.failed)
            .setMetamaskAddress(mmAddress)
            .setError((error as Error).message)
        );
      }
    } finally {
      setOpenMmConnectDialog(false);
    }
  };

  let isRecovered = false;
  const handleRunPairing: () => Promise<boolean | undefined> = async () => {
    try {
      const runPairingRes = await runPairing(provider);
      trackAnalyticEvent(
        EventName.pairing_device,
        new AnalyticEvent().setStatus(EventStatus.initiated)
      );

      try {
        const deviceOS = runPairingRes.response?.deviceName
          .split(':')[1]
          .split(',')[0]
          .trim() as DeviceOS;
        setDeviceOS(deviceOS);
      } catch (error) {
        console.error('Error while parsing device OS from deviceName:', error);
        throw new SnapError((error as Error).message, -1);
      }

      if (runPairingRes.response?.address) {
        isRecovered = true;
        setAppState({
          status: AppStatus.AccountCreationInProgress,
        });
        trackAnalyticEvent(
          EventName.pairing_device,
          new AnalyticEvent()
            .setStatus(EventStatus.success)
            .setType(EventType.recovered)
            .setPublicKey(runPairingRes.response.address)
        );
      } else {
        isRecovered = false;
        setAppState({
          status: AppStatus.Paired,
          qr: null,
          seconds: 0,
        });
        const runKgResp = await runKeygen(provider);
        setAppState({
          status: AppStatus.AccountCreationInProgress,
        });
        trackAnalyticEvent(
          EventName.pairing_device,
          new AnalyticEvent() //
            .setStatus(EventStatus.success)
            .setType(EventType.new_account)
            .setPublicKey(runKgResp.response?.address)
        );
      }

      return true;
    } catch (error: unknown) {
      trackAnalyticEvent(
        EventName.pairing_device,
        new AnalyticEvent() //
          .setStatus(EventStatus.failed)
          .setType(isRecovered ? EventType.recovered : EventType.new_account)
          .setError((error as Error).message)
      );
      if (error instanceof SnapError) {
        handleSnapErrorTemplate(error, () => {
          setAppState({
            status: AppStatus.Unpaired,
          });
        });
      }
    }
  };

  const handleRePairing = async () => {
    let isRepairSameAccount = false;
    let currentAccount: KeyringAccount;
    let publicKey = '';
    try {
      if (
        appState.status !== AppStatus.RePaired &&
        appState.status !== AppStatus.AccountCreated &&
        appState.status !== AppStatus.RePairing &&
        appState.status !== AppStatus.MismatchRepairing
      ) {
        return;
      }
      currentAccount = appState.account;
      publicKey = appState.account?.address;
      trackAnalyticEvent(EventName.recover_on_phone, new AnalyticEvent().setPublicKey(publicKey));

      const isRePairingFromCancelRestoration = appState.status === AppStatus.MismatchRepairing;
      const initPairingRes = await initPairing(provider, true);
      setAppState({
        status: AppStatus.RePairing,
        qr: initPairingRes.response.qrCode,
        seconds: 30,
        account: appState.account,
      });
      if (isRePairingFromCancelRestoration) {
        toast(<ErrorToast msg={CANCEL_RESTORATION} />);
      }

      const runRePairingRes = await runRePairing(provider);
      trackAnalyticEvent(
        EventName.re_pairing_device,
        new AnalyticEvent() //
          .setStatus(EventStatus.initiated)
          .setPublicKey(publicKey)
      );
      const currentAddress = runRePairingRes.response.currentAccountAddress[0];
      const recoveredAddress = runRePairingRes.response.newAccountAddress;
      if (recoveredAddress === null) {
        setAppState({
          status: AppStatus.AccountCreated,
          account: appState.account,
        });
        toast(
          <ErrorToast msg="Restoring failed. Please restore existing account with at least one backup on your phone" />
        );
        trackAnalyticEvent(
          EventName.re_pairing_device,
          new AnalyticEvent() //
            .setStatus(EventStatus.failed)
            .setPublicKey(publicKey)
            .setError('No backup found on phone')
        );
        return;
      }

      isRepairSameAccount = currentAddress === recoveredAddress;
      if (isRepairSameAccount) {
        const accounts = await getKeyringClient(provider).listAccounts();
        if (accounts.length > 0) {
          setAppState({
            status: AppStatus.RePaired,
            account: accounts[0],
          });
          trackAnalyticEvent(
            EventName.re_pairing_device,
            new AnalyticEvent()
              .setStatus(EventStatus.success)
              .setType(EventType.same_account)
              .setPublicKey(publicKey)
          );
        }
      } else {
        setAppState({
          status: AppStatus.MismatchRepairing,
          account: appState.account,
          snapAccountAddress: currentAddress,
          phoneAccountAddress: recoveredAddress,
        });
        localStorage.setItem(
          'MismatchRepairing',
          JSON.stringify({
            snapAccountAddress: currentAddress,
            phoneAccountAddress: recoveredAddress,
          })
        );
        trackAnalyticEvent(
          EventName.re_pairing_device,
          new AnalyticEvent()
            .setStatus(EventStatus.success)
            .setType(EventType.different_account)
            .setPublicKey(recoveredAddress)
        );
      }
    } catch (error: unknown) {
      trackAnalyticEvent(
        EventName.re_pairing_device,
        new AnalyticEvent()
          .setStatus(EventStatus.failed)
          .setType(isRepairSameAccount ? EventType.same_account : EventType.different_account)
          .setPublicKey(publicKey)
          .setError((error as Error).message)
      );
      if (error instanceof SnapError) {
        handleSnapErrorTemplate(error, () => {
          setAppState({
            status: AppStatus.AccountCreated,
            account: currentAccount,
          });
        });
      }
    }
  };

  const handleCreateAccount = async () => {
    if (!(await isConnected(provider))) {
      await handleMetaMaskConnect();
    }
    let publicKey = '';
    try {
      const changeAppStateBeforeAccountCreation = () => {
        appState.status !== AppStatus.MismatchRepairing &&
        appState.status !== AppStatus.AccountRestorationDenied
          ? setAppState({ status: AppStatus.AccountCreationInProgress })
          : setAppState({ status: AppStatus.AccountRestorationInProgress });
      };

      const changeAppStateAfterAccountCreation = () => {
        appState.status !== AppStatus.AccountRestorationInProgress
          ? setAppState({
              status: AppStatus.BackupInstruction,
            })
          : setAppState({
              status: AppStatus.AccountCreated,
              account,
            });
      };

      changeAppStateBeforeAccountCreation();
      const account = await getKeyringClient(provider)
        .createAccount()
        .catch((error) => {
          const rpcError = error as ProviderRpcError;
          const snapErr = parseRpcError(rpcError);
          throw snapErr;
        });
      publicKey = account.address;
      trackAnalyticEvent(
        EventName.snap_account_created,
        new AnalyticEvent()
          .setSuccess(true)
          .setType(
            isRecovered ||
              appState.status === AppStatus.MismatchRepairing ||
              appState.status === AppStatus.AccountRestorationInProgress
              ? EventType.recovered
              : EventType.new_account
          )
          .setPublicKey(publicKey)
          .setWallet()
      );
      changeAppStateAfterAccountCreation();
    } catch (error: unknown) {
      if (error instanceof SnapError) {
        if (error.code === 14) {
          toast(<ErrorToast msg={ACCOUNT_CREATION_REJECTED_TOAST_MSG} />);
          trackAnalyticEvent(
            EventName.snap_account_created,
            new AnalyticEvent()
              .setSuccess(false)
              .setType(
                isRecovered ||
                  appState.status === AppStatus.MismatchRepairing ||
                  appState.status === AppStatus.AccountRestorationInProgress
                  ? EventType.recovered
                  : EventType.new_account
              )
              .setPublicKey(publicKey)
              .setError(REJECTED_ERROR)
              .setWallet()
          );
        } else {
          handleSnapErrorTemplate(error);
        }
      } else {
        trackAnalyticEvent(
          EventName.snap_account_created,
          new AnalyticEvent()
            .setSuccess(false)
            .setType(
              isRecovered ||
                appState.status === AppStatus.MismatchRepairing ||
                appState.status === AppStatus.AccountRestorationInProgress
                ? EventType.recovered
                : EventType.new_account
            )
            .setPublicKey(publicKey)
            .setError((error as SnapError).message)
            .setWallet()
        );
      }
      appState.status === AppStatus.MismatchRepairing
        ? setAppState({ status: AppStatus.AccountRestorationDenied })
        : setAppState({ status: AppStatus.AccountCreationDenied });
    }
  };

  const handleOnBackupInstructionDone = async () => {
    try {
      const account = await getKeyringClient(provider).createAccount();
      await handleSnapVersion();
      setAppState({
        status: AppStatus.AccountCreated,
        account,
      });
    } catch (error: unknown) {
      if (error instanceof SnapError) {
        handleSnapErrorTemplate(error);
      }
    }
  };

  const handleDeleteAccount: () => Promise<boolean | undefined> = async () => {
    let publicKey = '';
    try {
      const client = getKeyringClient(provider);
      const accounts = await client.listAccounts().catch((error) => {
        throw new SnapError((error as Error).message, -1);
      });
      if (accounts.length > 0) {
        publicKey = accounts[0].address;
        await client.deleteAccount(accounts[0].id).catch((error) => {
          const rpcError = error as ProviderRpcError;
          if (rpcError.code === -32603) {
            console.error('User denied account removal.');
            throw new SnapError('User denied account removal.', -32603);
          } else {
            throw new SnapError((error as Error).message, -1);
          }
        });
        trackAnalyticEvent(
          EventName.delete_account,
          new AnalyticEvent() //
            .setStatus(EventStatus.success)
            .setPublicKey(publicKey)
            .setWallet()
        );
        return true;
      }
    } catch (error) {
      if (error instanceof SnapError) {
        if (error.code === -32603) {
          trackAnalyticEvent(
            EventName.delete_account,
            new AnalyticEvent() //
              .setStatus(EventStatus.cancelled)
              .setPublicKey(publicKey ?? '')
              .setWallet()
          );
        } else {
          handleSnapErrorTemplate(error);
          trackAnalyticEvent(
            EventName.delete_account,
            new AnalyticEvent() //
              .setStatus(EventStatus.failed)
              .setPublicKey(publicKey)
              .setWallet()
              .setError((error as Error).message)
          );
        }
      }
    }
  };

  const handleSnapVersion = useCallback(async () => {
    try {
      const snapVersionRes = await snapVersion(provider);
      if (snapVersionRes.response)
        setSnapMetadata({
          currentSnapVersion: snapVersionRes.response.currentVersion,
          latestSnapVersion: snapVersionRes.response.latestVersion,
        });
    } catch (error: unknown) {
      if (error instanceof SnapError) {
        handleSnapErrorTemplate(error);
      }
    }
  }, []);

  const handleUpdateSnapVersion = async () => {
    if (snapMetadata) {
      try {
        await handleSnapVersion();
        await connectSnap(snapMetadata.latestSnapVersion, provider);
        setSnapMetadata({
          ...snapMetadata,
          currentSnapVersion: snapMetadata.latestSnapVersion,
        });
      } catch (error) {
        if (error instanceof SnapError) {
          if (error.code === 4001) {
            toast(<ErrorToast msg={CONNECTION_REJECTED_UPDATE_SNAP_TOAST_MSG} />);
          } else {
            handleSnapErrorTemplate(error);
          }
        }
      }
    }
  };

  const handleReset = useCallback(async () => {
    setAppState({
      status: AppStatus.Unpaired,
    });
    try {
      if (await isConnected(provider)) {
        await unPair(provider);
      }
    } catch (error: unknown) {
      if (error instanceof SnapError) {
        handleSnapErrorTemplate(error);
      }
    }
  }, []);

  const handleSnapState = useCallback(async () => {
    try {
      if (await isConnected(provider)) {
        await handleSnapVersion();
        const isPairedRes = await isPaired(provider);
        if (isPairedRes.response?.isPaired) {
          const accounts = await getKeyringClient(provider).listAccounts();
          if (accounts.length === 0) {
            if (isPairedRes.response.isAccountExist) {
              setAppState({ status: AppStatus.AccountCreationDenied });
            } else {
              handleReset();
            }
          } else {
            // To keep restoration screen while reloading the page
            const mismatchRepairingState = localStorage.getItem('MismatchRepairing');
            if (mismatchRepairingState) {
              const { snapAccountAddress, phoneAccountAddress } =
                JSON.parse(mismatchRepairingState);
              setAppState({
                account: accounts[0],
                phoneAccountAddress,
                snapAccountAddress,
                status: AppStatus.MismatchRepairing,
              });
            } else {
              setAppState({
                status: AppStatus.AccountCreated,
                account: accounts[0],
              });
            }
          }
        }
      }
      setLoading(false);
    } catch (error) {
      if (error instanceof SnapError) {
        handleSnapErrorTemplate(error);
      }
    }
  }, [handleReset, handleSnapVersion]);

  useEffect(() => {
    const onAnnouncement = (event: any) => {
      const providerDetail = event.detail;
      if (
        providerDetail.info.rdns === 'io.metamask' ||
        providerDetail.info.rdns === 'io.metamask.flask' ||
        providerDetail.info.rdns === 'io.metamask.mmi'
      ) {
        provider = providerDetail.provider;
        setTimeout(() => {
          setOpenInstallDialog(false);
          handleSnapState();
        }, 1000);
      } else {
        setOpenInstallDialog(true);
      }
    };
    window.addEventListener('eip6963:announceProvider', onAnnouncement);
    window.dispatchEvent(new Event('eip6963:requestProvider'));

    setTimeout(() => {
      if (!provider) {
        setOpenInstallDialog(true);
        setLoading(false);
      } else {
        setOpenInstallDialog(false);
      }
    }, 300);

    return () => {
      window.removeEventListener('eip6963:announceProvider', onAnnouncement);
    };
  }, [handleSnapState, handleSnapVersion]);

  useEffect(() => {
    if (appState.status === AppStatus.Pairing || appState.status === AppStatus.RePairing) {
      if (appState.seconds > 0) {
        const intervalId = setInterval(() => {
          if (appState.status === AppStatus.Pairing || appState.status === AppStatus.RePairing)
            setAppState({
              ...appState,
              seconds: appState.seconds - 1,
            });
        }, 1000);
        return () => clearInterval(intervalId);
      }
    }
  }, [appState]);

  return loading ? (
    <div className="app-container" style={{ justifyContent: 'center' }}>
      <Spinner />
    </div>
  ) : (
    <div className="app-container">
      <NavBar />
      {/* Body */}

      {(appState.status === AppStatus.AccountCreated || appState.status === AppStatus.RePaired) &&
      appState.account &&
      snapMetadata !== undefined &&
      provider !== undefined ? (
        <div className="flex flex-col flex-1 bg-pattern">
          <Homescreen
            isRepaired={appState.status === AppStatus.RePaired}
            onContinueClick={handleReset}
            onSnapUpdate={handleUpdateSnapVersion}
            onRePairing={handleRePairing}
            onDeleteAccount={handleDeleteAccount}
            currentSnapVersion={snapMetadata.currentSnapVersion}
            latestSnapVersion={snapMetadata.latestSnapVersion}
            account={appState.account}
          />
          <div className="text-white-primary full-w flex mt-auto justify-end mx-auto lg:mr-14 mb-6 label-regular z-50">
            Snap version: {snapMetadata.currentSnapVersion}
          </div>
        </div>
      ) : (
        <div className="w-full relative bg-pattern" style={{ zIndex: 1 }}>
          <img className="bg-pattern-2nd-layer -z-10" src="/v2/pattern.png" alt=""></img>
          {(() => {
            switch (appState.status) {
              case AppStatus.Unpaired:
                return (
                  <Installation
                    onConnectMmClick={async () => {
                      setOpenMmConnectDialog(true);
                      await handleConnectMmClick();
                    }}
                  />
                );

              case AppStatus.AccountCreationInProgress:
              case AppStatus.AccountRestorationInProgress:
                return (
                  <AccountCreation
                    isRestoration={appState.status === AppStatus.AccountRestorationInProgress}
                    step={{
                      progressBarValue: 50,
                      onGoingBackClick: handleReset,
                    }}
                    disableBackward={true}
                  />
                );
              case AppStatus.AccountCreationDenied:
              case AppStatus.AccountRestorationDenied:
                return (
                  <ErrorState
                    onRetryClick={async () => {
                      await handleCreateAccount();
                    }}
                    step={{
                      progressBarValue: 25,
                      onGoingBackClick: handleReset,
                    }}
                  />
                );
              case AppStatus.Pairing:
              case AppStatus.Paired:
              case AppStatus.RePairing:
                return (
                  <Pairing
                    isRepairing={appState.status === AppStatus.RePairing}
                    qr={appState.qr}
                    seconds={appState.seconds}
                    currentAddress={
                      appState.status === AppStatus.RePairing ? appState.account?.address : ''
                    }
                    onTryAgainClick={async () => {
                      if (appState.status === AppStatus.RePairing) {
                        await handleRePairing();
                      } else {
                        await handleInitPairing().then((isInitPairingDone) => {
                          if (isInitPairingDone) {
                            handleRunPairing().then((isPairingDone) => {
                              if (isPairingDone) {
                                handleCreateAccount();
                              }
                            });
                          }
                        });
                      }
                    }}
                    loading={appState.status === AppStatus.Paired}
                    step={{
                      progressBarValue: 25,
                      onGoingBackClick: async () => {
                        if (appState.status === AppStatus.RePairing) {
                          setAppState({
                            status: AppStatus.AccountCreated,
                            account: appState.account,
                          });
                        } else {
                          await handleReset();
                        }
                      },
                    }}
                  />
                );

              case AppStatus.BackupInstruction:
                return (
                  <BackupRecovery
                    onDone={handleOnBackupInstructionDone}
                    step={{
                      progressBarValue: 75,
                    }}
                    deviceOS={deviceOS}
                  />
                );
              case AppStatus.MismatchRepairing:
                return (
                  <MismatchRepairing
                    snapAccountAddress={appState.snapAccountAddress}
                    phoneAccountAddress={appState.phoneAccountAddress}
                    onCancleRestoration={async () => {
                      localStorage.removeItem('MismatchRepairing');
                      await handleRePairing();
                    }}
                    onCreateAccount={handleCreateAccount}
                    onDeleteAccount={handleDeleteAccount}
                  />
                );
              default:
                return null;
            }
          })()}
        </div>
      )}
      {/* Dialogs */}
      {!isMobileWidthSize && (
        <Dialog open={openInstallDialog} onOpenChange={setOpenInstallDialog}>
          <DialogContent
            onInteractOutside={(e) => {
              e.preventDefault();
            }}
            className="flex flex-col items-center justify-center py-16 px-10 bg-[#121212] border-none outline-none w-[49.5vw] max-w-[650px]">
            <img src="/v2/mmfox.svg" alt="mmfox" style={{ width: 156, height: 156 }} />
            <div className="my-10 text-center h2-bold text-white-primary">
              Install MetaMask extension!
            </div>
            <div className="mt-2 text-center b1-regular" style={{ color: '#EDEEF1' }}>
              Looks like you don’t have MetaMask extension. To start using Snaps, you&apos;ll need
              the MetaMask extension for your browser
            </div>
            <Button
              className="bg-indigo-primary hover:bg-indigo-hover active:bg-indigo-active w-full self-center mt-8 text-white-primary btn-lg"
              onClick={() => {
                window.open('https://metamask.io/download/', '_blank');
                setOpenInstallDialog(false);
              }}>
              Get MetaMask
            </Button>
          </DialogContent>
        </Dialog>
      )}

      {isMobileWidthSize && (
        <Dialog defaultOpen={true}>
          <DialogContent className="flex flex-col items-center justify-center py-14 px-4 bg-[#121212] border-none outline-none w-[92vw]">
            <img src="/v2/warn.png" alt="warn" style={{ width: 204, height: 133 }} />
            <div className="mt-6 text-center text-white-primary h2-md">
              Uh-oh! Device not supported
            </div>
            <div className="mt-2 text-center b2-regular" style={{ color: '#D8DBDF' }}>
              This website requires you to connect to your MetaMask extension. Please view it on a{' '}
              <span className="b2-bold">Desktop Browser</span>.
            </div>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={openMmConnectDialog} onOpenChange={setOpenMmConnectDialog}>
        <DialogContent
          className="flex flex-col items-center justify-center py-14 px-24 w-[36.72vw] h-auto bg-[#121212] border-none outline-none max-w-[480px]"
          onInteractOutside={(e) => {
            e.preventDefault();
          }}>
          <img src="/v2/mmfox-approve.svg" alt="mmfox-approve" />
          <div
            className="mt-2 text-center text-white-primary"
            style={{ fontSize: 16, fontWeight: 500 }}>
            Approve on MetaMask to continue
          </div>
        </DialogContent>
      </Dialog>

      <ToastContainer
        hideProgressBar
        icon={false}
        closeButton={false}
        toastClassName={() => ''}
        bodyClassName={() => ''}
      />
    </div>
  );
};

export default App;
