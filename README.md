# kata-angular-rxjs

Quelques exemples d'utilisation des différent opérateurs principaux de RXJS.

[Tenter de résoudre ces exercices dans Stackblitz ⚡️](https://stackblitz.com/~/github.com/jcchalte/kata-angular-rxjs)

Pour réaliser ces exercices, il suffit de faire passer l'ensemble des tests unitaires du dossier [exercices](./src/exercices). Initialement, tous ces tests sont décorés via les lignes `pending('en attente de résolution');`. Il s'agit donc de supprimer ces lignes tests par tests, puis à ajouter dans l'étape "WHEN" le ou les opérateurs nécessaires pour faire passer chacun des tests.

Quelques liens importants à connaître :
- Liste des opérateurs RXJS : [documentation RXJS](https://rxjs.dev/guide/operators), [documentation ReactiveX](https://reactivex.io/documentation/operators.html) et [documentation learnRXJS](https://www.learnrxjs.io/learn-rxjs/operators)
-  [`Marble testing`](https://rxjs.dev/guide/testing/marble-testing) : syntaxe facilitant l'écriture de tests unitaires sur RXJS, utilisé dans chacun des tests pour la création d'observables et l'écriture des résultats attendus
