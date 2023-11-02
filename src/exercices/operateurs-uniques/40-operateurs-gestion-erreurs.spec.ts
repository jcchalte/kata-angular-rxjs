import {
  catchError,
  concatMap, filter,
  map,
  of, retry, scan,
  switchMap, withLatestFrom
} from "rxjs";
import {
  CalculetteActions,
  EtatFusee,
  getTestScheduler, MouvementSourisActions
} from "../exercices.helpers";

describe('40 - Opérateurs de gestion des erreurs', () => {
  it(`peut catch une exception pour renvoyer une dernière valeur`, ()=> {
    pending('en attente de résolution');

    getTestScheduler().run(({cold, expectObservable}) => {
      //Nous souhaitons suivre l'état d'une fusée lors de son démarrage
      //Nous disposons d'une API nous renvoyant l'état de la fusée au cours de son lancement.
      //Cependant, si la fusée explose, une exception est jetée, et aucune valeur n'est émise
      //Nous souhaitons disposer d'un observable qui nous émet toutes les valeurs émises lors du lancement de l'application mais qui dans le cas d'une erreur nous renvoie la valeur "détruite"

      //GIVEN une API des messages émis par la fusée qui renvoie jette une exception tout au bout
      const messagesFusee$ = cold<EtatFusee>('a----b---c---c---c--#', {a:EtatFusee.Éteint, b:EtatFusee.AllumageMoteur, c:EtatFusee.Ascension})

      //WHEN
      const etatFusee$ = messagesFusee$.pipe(
       //TODO : catcher l'erreur et renvoyer la valeur "EtatFusee.Éteint"
      );

      expectObservable(etatFusee$).toBe('a----b---c---c---c--(d|)', {a:EtatFusee.Éteint, b:EtatFusee.AllumageMoteur, c:EtatFusee.Ascension, d:EtatFusee.Détruite})
    })
  });


  it(`peut relancer un observable lorsqu'une erreur a lieu`, ()=> {
    pending('en attente de résolution');

    getTestScheduler().run(({cold, hot, expectObservable}) => {
      //Nous reprenons l'exemple des mouvements de souris que l'on souhaite sauvegarder côté serveur
      //Nous disposons à la fois :
      // - d'un observable mouvementsSouris$ analogue à un sujet qui émet la position de la souris à chaque interval
      const mouvementsSouris$ = hot<MouvementSourisActions>('a---b---c---d---e---f---g---h---(i|)', {
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

      let logID = 0;

      const apiLogMouvementSouris = (mouvement: MouvementSourisActions)=>{
        //On simule un crash serveur
        if(mouvement.x == 3)
          return cold<number>('-#');

        logID++;
        return cold<number>('-(a|)', {a:logID})
      };

     const logMouvementSouris$ = mouvementsSouris$.pipe(
       switchMap((mouvement)=>apiLogMouvementSouris(mouvement)),
       //TODO : "relancer" l'observable source lorsqu'une erreur a lieu
     );

      //On s'attend à récupérer l'ID correspondant à chacun des logs de mouvements, hormis pour  d: {x: 3, y: 3} et  e: {x: 3, y: 3} qui ont crashé
      //Néanmoins, ces crashs sont juste omis de l'observable en sortie
     expectObservable(logMouvementSouris$).toBe('-a---b---c-----------f---g---h---(i|)', {
       a:1,
       b:2,
       c:3,
       f:4,
       g:5,
       h:6,
       i:7
     })

      //A noter, lorsque vous gérez des exceptions via l'utilisation des retry, il devient très important de comprendre que vous vous réinscrivez à l'observable source tel qu'il est déclaré
      //Dans ce test, mouvementsSouris$ est un observable "hot", c'est à dire une sorte de sujet, qui émet ses valeurs dans le temps à partir de sa création et non pas un observable "cold" qui n'émettrait  qu'à partir de sa souscription.
      //Du coup, lorsque vous vous réinscrivez sur apiLogMouvementSouris$, vous ne relancez pas mouvementsSouris$ depuis le début mais vous recevrez juste les futures notifications
      //Essayez de réfléchir à comment logMouvementSouris$ fonctionnerait s'il s'agissait d'un observable cold
    })
  });

  it('peut gérer des erreurs sur appels serveur', ()=>{
    pending('en attente de résolution');

    getTestScheduler().run(({cold, hot, expectObservable}) => {
      // Exemple un peu plus complexe.
      // On souhaite proposer une fonctionnalité de sauvegarde de l'état de la calculatrice.
      // On dispose donc toujours d'un flux des actions, et on dispose aussi de l'observable nous renvoyant l'état de la calculatrice
      // Lorsque l'action déclenchée est de type "sauvegarderResultat", alors on souhaite déclencher un appel au serveur.
      // L'appel au serveur peut parfois crasher. Dans ce cas, on souhaite informer le reste de l'application de cet échec
      // mais on ne souhaite pas arrêter les futures sauvegardes pour autant.

      //GIVEN :
      // - un sujet renvoyant des actions utilisateur
      const actions$ = hot<CalculetteActions>('-a-b--c---d--e---f--g----h|', {
        a: {kind: 'ajouter', valeur: 1},
        b: {kind: 'ajouter', valeur: 5},
        c: {kind: 'soustraire', valeur: 2},
        d: {kind: 'multiplier', valeur: 3},
        e: {kind: 'sauvegarderResultat'},
        f: {kind: 'ajouter', valeur: 1},
        g: {kind: 'sauvegarderResultat'},
        h: {kind: 'sauvegarderResultat'},
      });
      // - un observable nous renvoyant le résultat actuel
      const valeurCalcul$ = actions$.pipe(
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
        },0),
      );

      let nombreAppel = 0;
      const erreurFictive = new Error('Une erreur fictive renvoyée par le serveur');

      // - une API pour sauvegarder le résultat
      const sauvegardeAPI$ = (valeur:number)=>{
        nombreAppel++;
        if(nombreAppel == 2)
          return cold<number>('--#', {}, erreurFictive);

        return cold<number>('--a|', {a:valeur})
      }

      //WHEN
      const sauvegarderResultatEffects$ = actions$.pipe(
        filter(f=>f.kind === 'sauvegarderResultat'),
        withLatestFrom(valeurCalcul$),
        concatMap(([,valeur])=>{
          return sauvegardeAPI$(valeur).pipe(
            map((serverResult)=>{
              return {kind:'apiASauvegardeResultat', valeur:serverResult}
            }),
            //TODO : gérer ici le crash du serveur pour renvoyer {kind:'apiNAPasSauvegardeResultat', error:erreurDuServeur}
            //ici ?...
          );
        }),
        //Ou là ?... Seul un des 2 choix est le bon... pourquoi ?
      )

      expectObservable(sauvegarderResultatEffects$).toBe('---------------a------b----c|', {
        a:{kind:'apiASauvegardeResultat', valeur:12},
        b:{kind:'apiNAPasSauvegardeResultat', error:erreurFictive},
        c:{kind:'apiASauvegardeResultat', valeur:13},
      })
    });
  })
});
