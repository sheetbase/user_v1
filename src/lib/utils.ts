import { KJUR } from 'jsrsasign-jwths';

export function sha256(input: string) {
    return KJUR.crypto.Util.sha256(input);
}

export function securePassword(password: string) {
    // TODO: implement bcrypt
    return sha256(password);
}

export function validEmail(email: string) {
    // tslint:disable-next-line:max-line-length
    return (/^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i).test(email);
}
