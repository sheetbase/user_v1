import { KJUR } from 'jsrsasign-jwths';

export function sha256(input: string) {
    return KJUR.crypto.Util.sha256(input);
}

export function isValidEmail(email: string) {
    // tslint:disable-next-line:max-line-length
    return (/^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i).test(email);
}

export function uniqueId(
    length = 12,
    startWith = '-',
): string {
    const maxLoop = length - 8;
    const ASCII_CHARS = startWith + '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz';
    let lastPushTime = 0;
    const lastRandChars = [];
    let now = new Date().getTime();
    const duplicateTime = (now === lastPushTime);
    lastPushTime = now;
    const timeStampChars = new Array(8);
    let i;
    for (i = 7; i >= 0; i--) {
        timeStampChars[i] = ASCII_CHARS.charAt(now % 64);
        now = Math.floor(now / 64);
    }
    let uid = timeStampChars.join('');
    if (!duplicateTime) {
        for (i = 0; i < maxLoop; i++) {
        lastRandChars[i] = Math.floor(Math.random() * 64);
        }
    } else {
        for (i = maxLoop - 1; i >= 0 && lastRandChars[i] === 63; i--) {
        lastRandChars[i] = 0;
        }
        lastRandChars[i]++;
    }
    for (i = 0; i < maxLoop; i++) {
        uid += ASCII_CHARS.charAt(lastRandChars[i]);
    }
    return uid;
}
