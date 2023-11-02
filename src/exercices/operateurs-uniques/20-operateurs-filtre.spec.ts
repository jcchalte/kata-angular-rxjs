import {AutocompleteActions, getTestScheduler, jeanne, titi, toto} from "../exercices.helpers";
import {debounceTime, distinctUntilChanged, distinctUntilKeyChanged, filter, first, last, skip, take} from "rxjs";

describe('20 - Opérateurs filtres', () => {

  it('peut filtrer les résultats', ()=>{
    pending('en attente de résolution');

    getTestScheduler().run(({cold, expectObservable}) => {
      //GIVEN
      const personnes$ = cold('a--b---c|', {a: toto, b: titi, c: jeanne});

      //WHEN
      const parisiens$ = personnes$.pipe(
        //TODO: récupérer uniquement les personnes habitant dans le 75
      );

      //THEN
      expectObservable(parisiens$).toBe('a--b----|', {a: toto, b: titi});
    })
  })

  it('peut émettre les valeurs distinctes successives - cas simple', ()=>{
    pending('en attente de résolution');

    getTestScheduler().run(({cold, expectObservable}) => {
      //nombreMailsPolling$ simule un observable qui émettrait toutes les x millisecondes le nombre de notifications non lues
      //On souhaite déclencher une petite animation sur l'icône de notification uniquement lorsque le nombre de mails non lus a changé.
      //Pour ce faire, il faut construire un observable qui n'émet les valeurs que si elles sont différentes de la précédente

      //GIVEN
      const nombreMailsPolling$ = cold<number>('a-b-c-d-e-f-g-h', {
        a: 1,
        b: 1,
        c: 2,
        d: 2,
        e: 3,
        f: 2,
        g: 1,
        h: 1,
      });

      //WHEN
      const nombreMailsClean$ = nombreMailsPolling$.pipe(
        //TODO : Filtrer les éléments en sortie pour ne pas sortir deux fois de suite une même valeur
      );

      //THEN
      expectObservable(nombreMailsClean$).toBe('a---b---c-d-e----', {a: 1, b: 2, c : 3, d: 2, e: 1});
    });
  })

  it('peut émettre les valeurs distinctes successives - cas plus complexe', ()=>{
    pending('en attente de résolution');

    getTestScheduler().run(({cold, expectObservable}) => {
      //Scénario : nous utilisons un composant qui permet à l'utilisateur de saisir une valeur numérique
      //Ce composant nous renvoie un observable qui émet à chaque saisie de l'utilisateur la valeur saisie
      //Nous souhaitons déclencher un traitement uniquement lorsque la valeur saisie par l'utilisateur change

      //GIVEN
      const valeurChampsPolling$ = cold<AutocompleteActions>('a-b-c-d-e-f-g-h', {
        a: {kind:'input', valeur: '1'},
        b: {kind:'input', valeur: '1'},
        c: {kind:'input', valeur: '2'},
        d: {kind:'input', valeur: '3'},
        e: {kind:'input', valeur: '3'},
        f: {kind:'input', valeur: '2'},
        g: {kind:'input', valeur: '1'},
        h: {kind:'input', valeur: '1'},
      });

      //WHEN
      const valeurChampsClean$ = valeurChampsPolling$.pipe(
        //TODO : filter les évènements pour ne pas réémettre 2 évènements possédant la même valeur
        //2 solutions sont possibles ici. Indices : KeyChanged ou une fonction de comparaison spécifique
      );

      //THEN
      expectObservable(valeurChampsClean$).toBe('a---b-c---d-e----', {
        a: {kind: 'input', valeur: '1'},
        b: {kind: 'input', valeur: '2'},
        c: {kind: 'input', valeur: '3'},
        d: {kind: 'input', valeur: '2'},
        e: {kind: 'input', valeur: '1'}
      });
    });
  })

  it(`peut debounce une saisie utilisateur`, () => {
    pending('en attente de résolution');

    getTestScheduler().run(({cold, expectObservable}) => {
      //Simule une saisie utilisateur au clavier : l'utilisateur saisie rapidement "a", "b" et "c", attends 5 secondes puis saisie rapidement "d" et "e"
      //Plus tard, on souhaitera déclencher une recherche côté serveur pour aider l'utilisateur dans sa saisie. Mais on ne souhaite pas surcharger le serveur lorsque l'utilisateur tape trop rapidement.
      //On préfère attendre que l'utilisateur ait "stabilisé" sa saisie avant de déclencher le traitement
      //On doit donc disposer d'un observable qui émet les valeurs saisies par l'utilisateur, mais uniquement lorsque cette saisie se sera stabilisée (dans cet exemple, pendant 100ms).

      //GIVEN
      const saisieUtilisateur$ = cold<AutocompleteActions>('a 99ms b 99ms c 5s d 99ms e', {
        a: {kind: 'input', valeur: 'a'},
        b: {kind: 'input', valeur: 'ab'},
        c: {kind: 'input', valeur: 'abc'},
        d: {kind: 'input', valeur: 'abcd'},
        e: {kind: 'input', valeur: 'abcde'},
      });

      //WHEN
      const saisieUtilisateurDebounced$ = saisieUtilisateur$.pipe(
        //TODO : mettre en place un anti-rebond de 100ms
      );

      //THEN
      expectObservable(saisieUtilisateurDebounced$).toBe('300ms a 5100ms b', {
        a: {kind: 'input', valeur: 'abc'},
        b: {kind: 'input', valeur: 'abcde'},
      });

    });
  });

  it(`peut récupérer le premier message uniquement`, () => {
    pending('en attente de résolution');

    getTestScheduler().run(({cold, expectObservable}) => {
      //Scénario : nous utilisons un service qui nous renvoie toutes les x secondes le nombre de personnes présentes dans notre magasin
      //Nous avons besoin de récupérer le plus rapidement possible le nombre de personnes présentes pour savoir si l'on doit ouvrir une nouvelle caisse
      //On souhaite donc récupérer uniquement le premier message émis par le service

      //GIVEN
      const affluence$=cold('---a--b-----c', {a: 400, b: 401,c:380});

      //WHEN
      const affluenceActuelle$ = affluence$.pipe(
        //TODO : ne prendre que le 1er élément
      );

      //THEN
      expectObservable(affluenceActuelle$).toBe('---(a|)', {a: 400});
    });
  })

  it(`peut récupérer le dernier message uniquement`, () => {
    pending('en attente de résolution');

    getTestScheduler().run(({cold, expectObservable}) => {
      //Scénario : on dispose d'une balance qui lorsqu'on l'on monte dessus nous fournit un observable qui émet le poids jusqu'à ce que la pesée soit stable
      //On souhaite récupérer uniquement le dernier message émis par la balance, sans se soucier de toutes les mesures précédentes

      //GIVEN
      const poids$=cold('---a--b--c-d--|', {a:78.5, b: 70.5, c:75.4, d: 75.5});

      //WHEN
      const poidsStable$ = poids$.pipe(
        //TODO : prendre uniquement le dernier élément
      );

      //THEN
      expectObservable(poidsStable$).toBe('--------------(a|)', {a: 75.5});
    });
  })

  it(`peut skip et take`, () => {
    pending('en attente de résolution');

    getTestScheduler().run(({cold, expectObservable}) => {
      //Scénario :
      //GIVEN
      const valeurs$=cold('--a--b--c---d--e--f--g|', {a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g:7});

      //WHEN
      const premierMessage$ = valeurs$.pipe(
        //TODO : Sauter les 3 premiers messages puis prendre les 2 suivants
      );

      //THEN
      expectObservable(premierMessage$).toBe('------------a--(b|)', {a: 4, b:5});
    });
  })
});
