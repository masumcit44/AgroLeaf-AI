# Disease classes

## MVP classes = the 6 folders of RiceLeafDiseaseBD v3
| id | English | Bangla | In BAMIS list? | Keep in MVP? |
|---|---|---|---|---|
| 0 | Healthy | সুস্থ পাতা | — | Yes |
| 1 | Blast | ব্লাস্ট | Yes | Yes |
| 2 | Brown Spot | বাদামী দাগ | Yes | Yes |
| 3 | Leaf Smut | পাতার স্মাট / পাতায় কালো দাগ (*Bangla term to be confirmed by an agronomist*) | **No** | **Conditional:** keep only if its validation recall is good. Otherwise route it to "not sure". No official Bangla guidance was found |
| 4 | Rice Tungro | টুংরো | Yes | Yes |
| 5 | Sheath Blight | খোল পোড়া | Yes | Yes. Note: the symptom is on the sheath; leaf-only photos may miss it |
| — | (no confident class) | নিশ্চিত নই | — | Shown when max prob < threshold |

**Important:** the class order must be read from the dataset folder names after download, then written into `model/class_index.json`. The app and the JSON knowledge files key on that order. The ids above are a placeholder.

### Why not drop Leaf Smut and Sheath Blight, as one team document suggested?
- That document said there was no Bangladeshi Leaf Smut dataset. RiceLeafDiseaseBD v3 does contain Leaf Smut, so the reason no longer holds.
- **The decision is driven by data:** train on all 6 classes. After evaluation, any class with low recall or precision is not shown as a confident result.

## Mapping for external testing (only exact matches)
| MVP class | RiceLeafDisease-BD5 (Savar) | RiceLeafBD (Sylhet–Dhaka) | RiceyLeafDisease (Sirajganj–Pabna) |
|---|---|---|---|
| Healthy | Normal Leaf | Healthy | Healthy Rice Leaf |
| Blast | Blast | — | Leaf Blast |
| Brown Spot | — (**Narrow Brown Spot is a different disease; don't map**) | Brown Spot | Brown Spot |
| Leaf Smut | — | — | — |
| Tungro | Tungro | Tungro Virus | — |
| Sheath Blight | Sheath Blight | — | Sheath Blight |
| *(not a training class)* | Narrow Brown Spot | Bacterial Leaf Blight | BLB, Leaf scald, NBLS, Hispa |

**Use the right-most row (diseases the model never saw) to test the "not sure" behaviour.** The ideal result is that the model says "not sure" rather than confidently naming a wrong disease.

**Leaf Smut cannot be tested externally**, because no external dataset has it. Say so on the Accuracy page.
