// Copyright (c) Silence Laboratories Pte. Ltd.
// This software is licensed under the Silence Laboratories License Agreement.

import { SnapError, SnapErrorCode } from "./error";
import { StorageData } from "./types";

const STORAGE_KEY = "SilentShare1";

/**
 * Function to check if a storage exist
 *
 * @returns true if exists, false otherwise
 */
const isStorageExist = (): boolean => {
    try {
        let data = localStorage.getItem(STORAGE_KEY);
        return data !== null;
    } catch (error) {
        throw error instanceof Error
            ? new SnapError(error.message, SnapErrorCode.StorageError)
            : new SnapError(`unknown-error`, SnapErrorCode.UnknownError);
    }
};

/**
 * Delete the stored data, if it exists.
 */
const deleteStorage = () => {
    localStorage.removeItem(STORAGE_KEY);
};

/**
 * Save SilentShareStorage
 *
 * @param data obj to save
 */
const saveSilentShareStorage = (data: StorageData) => {
    try {
        if (data == null) {
            throw new SnapError(
                "Storage data cannot be null",
                SnapErrorCode.InvalidStorageData
            );
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        throw error instanceof Error
            ? new SnapError(error.message, SnapErrorCode.StorageError)
            : new SnapError(`unknown-error`, SnapErrorCode.UnknownError);
    }
};

/**
 * Retrieve SilentShareStorage
 *
 * @returns SilentShareStorage object
 */
const getSilentShareStorage = (): StorageData => {
    try {
        const _isStorageExist = isStorageExist();
        if (!_isStorageExist) {
            throw new SnapError("Snap is not paired", SnapErrorCode.NotPaired);
        }

        let state = localStorage.getItem(STORAGE_KEY);

        if (!state) {
            throw new SnapError(
                "Snap failed to fetch state",
                SnapErrorCode.UnknownError
            );
        }

        const jsonObject: StorageData = JSON.parse(
            state as string
        );

        return jsonObject;
    } catch (error) {
        throw error instanceof Error
            ? new SnapError(error.message, SnapErrorCode.StorageError)
            : new SnapError(`unknown-error`, SnapErrorCode.UnknownError);
    }
};

export {
    isStorageExist,
    deleteStorage,
    saveSilentShareStorage,
    getSilentShareStorage,
};
