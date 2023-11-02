import {TestScheduler} from "rxjs/internal/testing/TestScheduler";

export function getTestScheduler(){
  return new TestScheduler((actual, expected) => {
    // asserting the two objects are equal - required
    // for TestScheduler assertions to work via your test framework
    // e.g. using jasmin
    expect(actual).toEqual(expected);
  });
}


export interface Adresse {
  rue:string;
  ville:string;
  departement:number;
}

export interface Personne{
  nom:string;
  prenom:string;
  age:number;
  adresse: Adresse
}

export const toto : Personne= {nom: 'Toto', prenom:'Dupont', age:10, adresse: {rue: 'rue de la paix', ville: 'Paris',departement:75}};
export const titi : Personne= {nom: 'Titi', prenom:'Dupont', age:12, adresse: {rue: 'rue de la paix', ville: 'Paris', departement:75}};
export const jeanne : Personne= {nom: 'Jeanne', prenom:'Meyer', age:45, adresse: {rue: 'rue de la tarte flambée', ville: 'Niederoberhaslach', departement:67}};


export type CalculetteActions = {kind:'ajouter', valeur:number} | {kind:'soustraire', valeur:number} | {kind:'multiplier', valeur:number} | {kind:'diviser', valeur:number} | {kind:'reset'} | {kind:'sauvegarderResultat'} | {kind:'apiASauvegardeResultat', valeur:number} | {kind:'apiNAPasSauvegardeResultat', error:any};
export type AutocompleteActions = {kind:'input', valeur:string};
export type MouvementSourisActions = {x:number, y:number};

export enum EtatOrdinateur{ Éteint='Éteint', EnCoursDeDemarrage='En cours de démarrage', Démarré='Démarré', EnCoursDExtinction='En cours d\eextinction'}
export enum EtatFusee{'Éteint', 'AllumageMoteur', 'Ascension', 'EnOrbite', 'Détruite'}


