import {
  concatAll, endWith,
  exhaustAll,
  map,
  mergeAll,
  startWith,
  switchAll
} from "rxjs";
import {
  EtatOrdinateur,
  getTestScheduler
} from "../exercices.helpers";

describe('30 - Opérateurs de jointure', () => {
  it('peut déclencher un appel serveur pour chaque message reçu en entrée en parallèle', ()=> {
    pending('en attente de résolution');

    getTestScheduler().run(({cold, expectObservable}) => {
      //Scénario : un utilisateur souhaite saisir un inventaire d'un magasin. Il dispose pour cela d'un petit formulaire qui lui permet de scanner des codes barres.
      //Lorsqu'il scanne un code barre, on souhaite envoyer le code barre au serveur pour récupérer le nom du produit correspondant.
      //Nous ne bloquons pas l'utilisateur pendant la récupération du nom pour ne pas l'interrompre.
      //Cependant, comme le traitement est long, il est possible que l'utilisateur saisisse un message pendant que l'on est déjà en train d'envoyer un message précédent
      //On souhaite envoyer les requêtes au serveur en parallèle au fur et à mesure et récupérer les noms de produit dès que possible

      //GIVEN un observable de scans et une API serveur
      const scans$ = cold('a--b---c|', {a: '7580991230172', b: '8444945522616', c: '2712821762088'});

      //Simule un appel serveur qui renvoie le nom du produit correspondant au code barre
      const recuperationCodeProduit$ = (ean13: string) => {
        let nomProduit ='';
        switch(ean13){
          case '7580991230172':
            nomProduit= 'Coca Cola';
            break;
          case '8444945522616':
            nomProduit= 'Orangina';
            break;
          case '2712821762088':
            nomProduit= 'Pepsi';
            break;
          }
        return cold('-----(a|)', {a: {ean: ean13, produit: nomProduit}});
      };

      //WHEN
      const reponsesServeurs$ = scans$.pipe(
        map(ean13 => recuperationCodeProduit$(ean13)),
        //TODO : applatir les observables pour récupérer directement la réponse de l'API
      )

      //THEN
      expectObservable(reponsesServeurs$).toBe('-----a--b---(c|)', {a: { ean: '7580991230172', produit: 'Coca Cola'}, b: { ean: '8444945522616', produit: 'Orangina'}, c: { ean: '2712821762088', produit: 'Pepsi'} });
    })
  });

  it(`peut déclencher un appel serveur pour chaque message reçu en entrée l'un après l'autre`, ()=> {
    pending('en attente de résolution');

    getTestScheduler().run(({cold, expectObservable}) => {
      //Scénario : Dans un système bancaire, nous récupérons dans un flux l'ensemble des transactions effectuées par un client.
      //Nous souhaitons impacter le solde du compte du client à chaque transaction.
      //Prendre en compte la transaction est un processus long qui nécesite un appel à un serveur distant
      //Une transaction qui ferait passer le compte à découvert doit créer des agios.
      //Il est donc important de prendre en compte chacune des transactions, tout en respectant absolument l'ordre : il ne faut pas prendre en compte la transaction suivante tant que la précédente n'a pas été prise en compte
      //Nous souhaitons au final récupérer un flux qui nous renvoie le solde du compte

      //GIVEN un flux de transaction et une API serveur capable de prendre en compte une transaction pour nous renvoyer le nouveau solde
      const transactions$ = cold('a--b---c---d', {a: 100, b: 30, c: -160,d: 500});

      let soldeActuel = 0;
      const appliquerTransactionEtRecupererNouveauSolde$ = (montant: number) => {
        let nouveauSolde = soldeActuel + montant;
        if(nouveauSolde < 0)
          //AGIOS
          nouveauSolde -= 10;
        soldeActuel = nouveauSolde;
        //On simule un appel serveur qui renvoie le nouveau solde
        return cold('-----a|', {a: soldeActuel});
      }


      //WHEN
      const solde$ = transactions$.pipe(
        map(transaction => appliquerTransactionEtRecupererNouveauSolde$(transaction)),
        //TODO : applatir les observables pour récupérer directement la réponse de l'API
      )

      //THEN
      expectObservable(solde$).toBe('-----a-----b-----c-----d', {a: 100, b: 130, c: -40 /* agios appliqués*/, d: 460});
    })
  });

  it(`peut déclencher un appel serveur pour chaque message reçu en entrée en omettant ceux intermédiaires`, ()=> {
    pending('en attente de résolution');


    getTestScheduler().run(({cold, expectObservable}) => {
      //Scénario : L'exemple est un peu tordu car je n'ai pas trouvé de cas simple à expliquer.
      //Si cet exemple s'avérait trop compliqué à comprendre, passez au prochain exemple !
      //
      //Dans un jeu vidéo, lorsqu'un joueur entre dans chacune des pièces d'un château, nous souhaitons déclencher un jingle sonore particulier
      //Cependant, si le joueur entre et sort rapidement de la pièce, nous ne souhaitons pas déclencher plusieurs sons en parallèle
      //Nous avons aussi besoin de savoir quand le jingle se termine pour déclencher un petit effet visuel
      //Nous souhaitons donc récupérer un flux qui déclenche le jingle et nous informe de sa complétion.

      //GIVEN un flux de pièces traversées et une API permettant de déclencher un jingle pour une pièce donnée
      //L'utilisateur rentre dans le donjon, va dans la pièce secrète, retourne dans le donjon, sort dans le cimetière un court instant en revenant dans le donjon puis finalement sort définitivement
      const piecesTraversees$ = cold('a----b----a-b-a---c|', {a: 'entreeDonjon', b: 'pieceSecrete', c: 'cimetière'});
      const declencherJingle = (pieceTraversee: string) => cold('a---(b|)', {a: 'start ' +pieceTraversee, b:'end ' + pieceTraversee});


      //WHEN
      const gererJingles$ = piecesTraversees$.pipe(
        map(pieceTraversee => declencherJingle(pieceTraversee)),
        //TODO : applatir les observables pour récupérer directement la réponse de l'API
      )

      //THEN
      expectObservable(gererJingles$).toBe('a---bc---da---b---e---(f|)', {a: 'start entreeDonjon', b: 'end entreeDonjon', c:'start pieceSecrete', d:'end pieceSecrete', e:'start cimetière', f:'end cimetière'});
    })
  });

  it(`peut déclencher un appel serveur pour chaque message reçu en entrée en redéclenchant un nouvel appel si un appel est déjà en cours`, ()=> {
    pending('en attente de résolution');

      getTestScheduler().run(({cold, expectObservable}) => {
        //Scénario : nous souhaitons offrir à l'utilisateur un champs "autocomplete". C'est à dire qu'au fur et à mesure de la saisie du texte, nous lui proposons des suggestions de mots
        //La liste des suggestions est déterminée côté serveur et prends un peu de temps
        //Dès que l'utilisateur saisit un nouveau caractère, nous souhaitons déclencher un nouvel appel serveur pour récupérer les suggestions correspondantes
        //Dans ce cas, si des appels sont déjà en cours, il n'est pas nécessaire d'attendre leurs réponses : nous pouvons directement les clôturer et ne nous intéresser plus qu'à la dernière recherche

        //GIVEN un flux de saisies utilisateur et une API permettant de récupérer les suggestions correspondantes
        const saisiesUtilisateurs$ = cold('a--b-c------d', {a: 's', b: 'sz', c: 'sa', d: 'sal'});
        const apiRecherche$ = (critere: string) => {
          const dictionnaire = [
            'salut',
            'salade',
            'saperlipopette',
          ]
          const suggestions = dictionnaire.filter(mot => mot.startsWith(critere));
          return cold('---(a|)', {a: suggestions});
        };

        //WHEN
        const resultatsRecherche$ = saisiesUtilisateurs$.pipe(
          map(critere => apiRecherche$(critere)),
          //TODO : applatir les observables
        )

        //THEN
        expectObservable(resultatsRecherche$).toBe('--------a------b', {a: [
            'salut',
            'salade',
            'saperlipopette',
          ], b: [
            'salut',
            'salade',
          ]});
      })
    });

  it(`peut injecter une valeur initiale et une valeur finale`, ()=>{
    pending('en attente de résolution');

    getTestScheduler().run(({cold, expectObservable}) => {
      //Scénario : Dans un datacenter, on souhaite suivre l'état d'un serveur parmis les valeurs "Eteint", "En cours d'allumage", "Démarré" et "En cours d'extinction" (cf. EtatOrdinateur dans exercices.helpers.ts)
      //Un petit script sur le serveur nous fourni déjà un observable qui nous indique si l'ordinateur est en cours d'allumage, démarré ou en cours d'extinction.
      //Cet observable débute lorsque le PC s'allume, et se clôture lorsque le PC s'éteint
      //Mais il ne nous indique jamais lorsqu'il est éteint (ce qui est le cas au tout début avant allumage, et à la fin après extinction)
      //Nous souhaitons créer un observable plus propre, c'est à dire un observable qui nous émet initalement le fait que l'ordinateur est éteint, puis nous renvoie toutes les valeurs de l'observable émis par le script, puis enfin, nous renvoie que l'ordinateur est à nouveau éteint.

      //GIVEN une api fournie par le serveur
      const etatViaScriptServeur$=cold<EtatOrdinateur>('----e---d-----x---|', {e:EtatOrdinateur.EnCoursDeDemarrage, d:EtatOrdinateur.Démarré, x:EtatOrdinateur.EnCoursDExtinction})

      const etatServeur$ = etatViaScriptServeur$.pipe(
       //TODO : injecter au début la valeur "Eteinte"
       //TODO : injecter à la fin la valeur "Eteinte"
      );

      expectObservable(etatServeur$).toBe('o---e---d-----x---(o|)', {o: EtatOrdinateur.Éteint, e:EtatOrdinateur.EnCoursDeDemarrage, d:EtatOrdinateur.Démarré, x:EtatOrdinateur.EnCoursDExtinction})
    });
  })
});
