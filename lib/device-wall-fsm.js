/**
 * A state machine for Device Wall picker popup
 */
'use strict';

import FSM from 'state-machine';
import uuid from 'uuid';
import {DEVICE_WALL, USER} from './action-names';

export default function(dispatch, getStateValue) {
    return new FSM({
        initial: {
            // Devices
            pickDevice,
            addDevice,
            editDevice,
            removeDevice,

            // Presets
            pickPreset,
            addPreset,
            editPreset,
            removePreset,
        },
        editDevice: {
            addPreset,
            addDevice: goToInitialState,
            update: updateCurrentStateData,
            submit() {
                // TODO validate device data here?
                dispatch({
                    type: USER.SAVE_DEVICE,
                    device: getStateValue('deviceWallPicker.stateData')
                });
                goToInitialState();
            },
            cancel: goToInitialState
        },
        editPreset: {
            addDevice,
            addPreset: goToInitialState,
            pickDevice(id) {
                var preset = getStateValue('deviceWallPicker.stateData');
                var devices = preset.devices ? preset.devices.slice(0) : [];
                var ix = devices.indexOf(id);
                ix === -1 ? devices.push(id) : devices.splice(ix, 1);
                this.handle('update', {devices});
            },
            update: updateCurrentStateData,
            submit(preset) {
                // TODO validate input here?
                dispatch({
                    type: USER.SAVE_PRESET,
                    preset
                });
                goToInitialState();
            },
            cancel: goToInitialState
        }
    }, {
        reset: goToInitialState,

        pickDevice(id) {
            this.handle('pickDevice', id);
        },
        addDevice() {
            this.handle('addDevice');
        },
        editDevice(id) {
            this.handle('editDevice', id);
        },
        removeDevice(id) {
            this.handle('removeDevice', id);
        },
        updateDeviceEditData(data) {
            this.handle('update', data);
        },
        submitDeviceEdit(device) {
            this.handle('submit', device);
        },
        cancelDeviceEdit() {
            this.handle('cancel');
        },

        pickPreset(id) {
            this.handle('pickPreset', id);
        },
        addPreset() {
            this.handle('addPreset');
        },
        editPreset(id) {
            this.handle('editPreset', id);
        },
        removePreset(id) {
            this.handle('removePreset', id);
        },
        updatePresetEditData(data) {
            this.handle('update', data);
        },
        submitPresetEdit(preset) {
            this.handle('submit', preset);
        },
        cancelPresetEdit() {
            this.handle('cancel');
        },
    });

    function goToInitialState() {
        dispatch({
            type: DEVICE_WALL.SET_STATE,
            state: 'initial'
        });
    }

    //
    // Device handlers
    //

    function pickDevice(id) {
        dispatch({
            type: DEVICE_WALL.SET_SELECTED,
            item: {id, type: 'device'}
        });
    }

    function addDevice() {
        dispatch({
            type: DEVICE_WALL.SET_STATE,
            state: 'editDevice',
            data: {id: uuid.v1()}
        });
    }

     function editDevice(id) {
        var device = findItem('user.devices', id);
        if (device) {
            dispatch({
                type: DEVICE_WALL.SET_STATE,
                state: 'editDevice',
                data: device
            });
        }
    }

    function removeDevice(id) {
        dispatch({
            type: USER.REMOVE_DEVICE,
            id
        });
    }

    //
    // Preset handlers
    //

    function pickPreset(id) {
        dispatch({
            type: DEVICE_WALL.SET_SELECTED,
            item: {id, type: 'preset'}
        });
    }

    function addPreset() {
        dispatch({
            type: DEVICE_WALL.SET_STATE,
            state: 'editPreset',
            data: {id: uuid.v1()}
        });
    }

    function editPreset(id) {
        var preset = findItem('user.presets', id);
        if (preset) {
            dispatch({
                type: DEVICE_WALL.SET_STATE,
                state: 'editPreset',
                data: preset
            });
        }
    }

    function removePreset(id) {
        dispatch({
            type: USER.REMOVE_PRESET,
            id
        });
    }

    function updateCurrentStateData(data={}) {
        var curData = getStateValue('deviceWallPicker.stateData') || {};
        dispatch({
            type: DEVICE_WALL.SET_STATE,
            state: this.current,
            data: {...curData, ...data}
        });
    }

    function findItem(storeKey, itemId) {
        return (getStateValue(storeKey) || []).filter(item => item.id === itemId)[0];
    }
}
