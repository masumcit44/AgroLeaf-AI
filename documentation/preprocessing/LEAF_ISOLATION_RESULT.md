# Leaf isolation / background strategies — result (3 Nov 2026)

Protocol: `LEAF_ISOLATION_PROTOCOL.md` (`a9d0816`, written before any result). Model: live v10, unchanged.
Script: `ml/tools/eval_leaf_isolation.py`. Raw numbers: `leaf_isolation_aman_result.json`.

## Result on the selection set (Aman 2025 unique, 422 photos)
| Strategy | Macro-F1 | Answered | Right among answered | Wrong answers | Correct outcome | Top class changed vs A |
|---|---|---|---|---|---|---|
| A (current app) | 0.896 | 55.0% | 58.6% | 22.7% | 74.9% | — |
| B white | 0.896 | 54.7% | 58.9% | 22.5% | 74.9% | 0.2% |
| C grey | 0.896 | 55.0% | 58.6% | 22.7% | 74.9% | 0% |
| D green | 0.896 | 55.0% | 58.6% | 22.7% | 74.9% | 0% |
| E blurred | 0.894 | 55.0% | 58.6% | 22.7% | 74.9% | 0.2% |
| F crop | 0.896 | 55.0% | 58.6% | 22.7% | 74.9% | 0% |

The strategies are (almost) identical to A because **isolation did not happen**:
- the mask covered more than 85% of the image in **421 of 422 photos**;
- the median green-pixel share is 0.97 of the frame.

## Why (root cause)
In a real rice-field photo, the background is **other rice plants**: green, and usually *greener* than the target leaf. A diseased leaf turns yellow-brown, so the colour mask selects the field and leaves the sick leaf as the gap (`leaf_isolation_examples/mask_example_0.jpg`).

**No colour or texture rule can tell "this rice leaf" from "the rice field behind it".** This is not a tuning problem; it is the wrong tool for field photos.

## Decision under the protocol
**No candidate → keep A.** Sylhet was **not** read for this experiment.

## What could work (not tested yet; for the owner to choose)
1. **User-guided crop:** the farmer drags a box around, or taps on, the sick leaf; the model sees that region (strategy F with a human-chosen box).
   - No new model. In-distribution, because training used random crops of 25–100% of the image.
   - Can be evaluated by simulating the box with the RiceLeafDiseaseBD lesion boxes.
   - Lowest risk and cost.
2. **A learned "target-leaf" segmenter or detector** (e.g. a small salient-object model under Apache/MIT, or a leaf detector trained on lesion boxes). It must be measured on field photos first: generic salient-object models may also pick the whole field.
3. **Background-randomised training for v11**, so the classifier itself learns to ignore the background. This fits the planned v11 retraining.

Nothing was deployed. The live site is unchanged.
