import {
  bufferTime,
  map,
  scan
} from "rxjs";
import {CalculetteActions, getTestScheduler, jeanne, MouvementSourisActions, titi, toto} from "../exercices.helpers";

describe('10 - Opérateurs transformation', () => {

  it('accéder à un sous-objet', () => {
    getTestScheduler().run(({cold, expectObservable}) => {
      //Scénario : un observable nous émets des instances de Personne.
      //Nous souhaitons afficher dans l'interface utilisateur uniquement leur adresse automatiquement à chaque fois qu'une nouvelle personne est émise

      //GIVEN
      const personnes$ = cold('a--b---c|', {a: toto, b: titi, c: jeanne});

      //WHEN
      const adresses$ = personnes$.pipe(
        //TODO: récupérer l'adresse de l'objet émis
        map(personne => personne.adresse)
      );

      //THEN
      expectObservable(adresses$).toBe('a--b---c|', {a: toto.adresse, b: titi.adresse, c: jeanne.adresse});
    })
  });

  it('effectuer un calcul', () => {
    getTestScheduler().run(({cold, expectObservable}) => {
      //Scénario : un observable nous émets des instances de Personne.
      //Nous souhaitons afficher dans l'interface utilisateur spécifiquement leur nom complet.

      //GIVEN
      const personnes$ = cold('a--b---c|', {a: toto, b: titi, c: jeanne});

      //WHEN
      const nomsComplets$ = personnes$.pipe(
        //TODO: récupérer le nom complet de la personne
        map(personne => personne.nom + ' ' + personne.prenom)
      );

      //THEN
      expectObservable(nomsComplets$).toBe('a--b---c|', {a: 'Toto Dupont', b: 'Titi Dupont', c: 'Jeanne Meyer'});
    })
  });

  it(`peut bufferiser les valeurs pour n'émettre les valeurs que toutes les X secondes`, ()=>{
    getTestScheduler().run(({cold, expectObservable}) => {
      //Scénario : pour le marketing, nous souhaitons suivre les mouvements de la souris afin de les envoyer côté serveur pour étude statistique ultérieure
      //On ne souhaite bien sûr pas déclencher un appel serveur à chaque mouvement de souris, mais plutôt regrouper tous les mouvements sur un interval de temps
      //Pour ce faire, nous avons donc besoin d'un observable qui à partir des mouvments de la souris nous renvoie les mouvements de la souris par paquet.

      //GIVEN
      //mouvementsSouris$$ simule un observable qui émettrait les mouvements de la souris
      //En réalité, il serait codé de la sorte :
      //fromEvent(document, 'mousemove').pipe(map(event => ({x: event.clientX, y: event.clientY})));
      const mouvementsSouris$ = cold<MouvementSourisActions>('a 99ms b 99ms c 99ms d 99ms e 99ms f 99ms g 99ms h 99ms (i|)', {
        a: {x: 1, y: 1},
        b: {x: 1, y: 1},
        c: {x: 2, y: 2},
        d: {x: 3, y: 3},
        e: {x: 3, y: 3},
        f: {x: 2, y: 2},
        g: {x: 1, y: 1},
        h: {x: 1, y: 1},
        i: {x: 1, y: 1},
      });

      const mouvementsBufferises = mouvementsSouris$.pipe(
        //TODO : Regrouper tous les mouvements par paquet de 300ms
        bufferTime(300)
      );

      expectObservable(mouvementsBufferises).toBe('300ms a 299ms b 199ms (c|)', {
        a: [{x: 1, y: 1}, {x: 1, y: 1}, {x:2, y:2}],
        b: [{x: 3, y: 3}, {x: 3, y: 3}, {x:2, y:2}, {x: 1, y: 1}],
        c: [{x: 1, y: 1}, {x: 1, y: 1}]
      });
    });
  })

  it(`accumuler une valeur - exemple de la calculatrice`, () => {
    getTestScheduler().run(({cold, expectObservable}) => {
      //Scénario : nous souhaitons coder une calculatrice qui à partir d'une liste d'actions nous renvoie le résultat du calcul
      //Exemple :en partant de 0, si l'on applique les actions suivantes : "ajouter 1", "ajouter 5", "soustraire 2", "multiplier par 3", on obtient le résultat final : 12
      //On souhaite disposer d'un observable qui à chaque action effectué par l'utilisateur nous renvoie le résultat actuel du calcul

      //GIVEN
      //actions$ simule un observable qui émet les actions de l'utilisateur suite à la saisie dans l'interface
      const actions$ = cold<CalculetteActions>('a-b--c---d--e|', {
        a: {kind: 'ajouter', valeur: 1},
        b: {kind: 'ajouter', valeur: 5},
        c: {kind: 'soustraire', valeur: 2},
        d: {kind: 'multiplier', valeur: 3},
        e: {kind: 'reset'},
      });

      //WHEN
      const resultat$ = actions$.pipe(
        //TODO : Accumuler un nombre pour chaque action en partant de 0
        scan((acc, action) => {
          if(action.kind === 'ajouter')
            return acc + action.valeur;
          if(action.kind === 'soustraire')
            return acc - action.valeur;
          if(action.kind === 'multiplier')
            return acc * action.valeur;
          if(action.kind === 'diviser')
            return acc / action.valeur;
          if(action.kind === 'reset')
            return 0;
          return acc;
        },0)
      )

      //THEN
      expectObservable(resultat$).toBe('a-b--c---d--e|', {a: 1, b: 6, c: 4, d: 12, e: 0});
    });
  });

});
