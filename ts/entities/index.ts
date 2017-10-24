export { character } from './character';
export { story } from './story';
export { tag } from './tag';

export interface Entity <T, TJSON>{
    (...args: any[]): T;
    load(input:T, ...args: any[]): void;
    getJSON(input: T): TJSON;
}

export type MayObservable<T> = T | KnockoutObservable<T>;
