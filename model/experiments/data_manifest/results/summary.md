# Rice-leaf image manifest summary

Files hashed: 41665; exact duplicate files: 3899; near-duplicate clusters (unique scenes): 30419.
Clusters with conflicting labels: 187. Train-pool unique scenes (label-consistent): 26294.
Test clusters that also appear in the train pool: {'test_diu': 19, 'final_test_used': 9}.

| source | role | country | files | unique scenes | white-bg share | healthy | blast | brown_spot | leaf_smut | tungro | sheath_blight | other_rice |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| gazipur_bd | train_pool | BD | 9769 | 8502 | 0.0 | 1484 | 1110 | 1807 | 623 | 1848 | 1656 | 0 |
| savar_bd | train_pool | BD | 3150 | 2493 | 0.94 | 655 | 534 | 0 | 0 | 390 | 527 | 390 |
| sylhet_bd | final_test_used | BD | 1560 | 1431 | 0.001 | 251 | 0 | 350 | 0 | 511 | 0 | 342 |
| diu_bd | test_diu | BD | 2753 | 2487 | 0.964 | 563 | 629 | 0 | 0 | 222 | 0 | 1164 |
| kyau_bd | train_pool | BD | 1701 | 1455 | 0.0 | 145 | 230 | 188 | 0 | 0 | 259 | 634 |
| dhan_shomadhan_bd | train_pool | BD | 1106 | 1096 | 0.216 | 0 | 268 | 139 | 0 | 193 | 282 | 217 |
| raihan_bd | mirror_check | BD | 1886 | 1631 | 0.0 | 175 | 235 | 194 | 0 | 0 | 275 | 754 |
| paddy_doctor_in | train_pool | IN | 10407 | 8441 | 0.0 | 1511 | 1428 | 762 | 0 | 907 | 0 | 3855 |
| sethy_in | train_pool | IN | 5932 | 2138 | 0.003 | 0 | 480 | 606 | 0 | 538 | 0 | 514 |
| gujarat_in | final_test_used | IN | 120 | 120 | 0.833 | 0 | 0 | 40 | 40 | 0 | 0 | 40 |
| karnataka_in | train_pool | IN | 200 | 190 | 0.0 | 0 | 43 | 48 | 0 | 0 | 0 | 99 |
| taiwan_tw | train_pool | TW | 927 | 865 | 0.084 | 290 | 499 | 76 | 0 | 0 | 0 | 0 |
| shivas_blast | train_pool | ?? | 1249 | 615 | 0.329 | 210 | 199 | 0 | 0 | 0 | 0 | 206 |
| iqbal_blast | train_pool | ?? | 132 | 111 | 0.0 | 0 | 111 | 0 | 0 | 0 | 0 | 0 |
| aman2025_bd | train_pool | BD | 773 | 738 | 0.0 | 100 | 133 | 178 | 0 | 0 | 0 | 327 |

## Train pool: unique label-consistent scenes by class and country

| class | ?? | BD | IN | TW |
|---|---|---|---|---|
| healthy | 206 | 2363 | 1505 | 290 |
| blast | 300 | 2198 | 1899 | 499 |
| brown_spot | 0 | 2190 | 1365 | 76 |
| leaf_smut | 0 | 617 | 0 | 0 |
| tungro | 0 | 2388 | 1438 | 0 |
| sheath_blight | 0 | 2733 | 0 | 0 |
| other_rice | 206 | 1622 | 4399 | 0 |

## Cross-source overlap (clusters of the row source that also contain the column source)

| | gazipur_bd | savar_bd | sylhet_bd | diu_bd | kyau_bd | dhan_shomadhan_bd | raihan_bd | paddy_doctor_in | sethy_in | gujarat_in | karnataka_in | taiwan_tw | shivas_blast | iqbal_blast | aman2025_bd |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| gazipur_bd | - | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 162 |
| savar_bd | 0 | - | 0 | 6 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| sylhet_bd | 0 | 0 | - | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 9 |
| diu_bd | 0 | 6 | 0 | - | 0 | 4 | 0 | 0 | 0 | 0 | 0 | 0 | 10 | 0 | 0 |
| kyau_bd | 0 | 0 | 0 | 0 | - | 0 | 1415 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 5 |
| dhan_shomadhan_bd | 0 | 1 | 0 | 4 | 0 | - | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 16 |
| raihan_bd | 0 | 0 | 0 | 0 | 1415 | 0 | - | 0 | 0 | 0 | 0 | 0 | 4 | 0 | 6 |
| paddy_doctor_in | 0 | 0 | 0 | 0 | 0 | 0 | 0 | - | 0 | 0 | 0 | 0 | 0 | 0 | 66 |
| sethy_in | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | - | 0 | 140 | 0 | 0 | 0 | 56 |
| gujarat_in | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | - | 0 | 0 | 0 | 0 | 0 |
| karnataka_in | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 140 | 0 | - | 0 | 0 | 0 | 13 |
| taiwan_tw | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | - | 0 | 0 | 0 |
| shivas_blast | 0 | 0 | 0 | 10 | 2 | 0 | 4 | 0 | 0 | 0 | 0 | 0 | - | 0 | 0 |
| iqbal_blast | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | - | 0 |
| aman2025_bd | 162 | 0 | 9 | 0 | 5 | 16 | 6 | 66 | 56 | 0 | 13 | 0 | 0 | 0 | - |
