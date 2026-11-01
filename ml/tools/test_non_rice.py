import json
import numpy as np
import onnxruntime as ort

session = ort.InferenceSession('frontend/public/models/rice-mnv3l-v1.onnx')
with open('frontend/public/data/calibration.json') as f:
    cal = json.load(f)

temp = cal['temperature']
threshold = cal['threshold']
suppress = cal.get('suppress', [])
with open('frontend/public/data/class_index.json') as f:
    classes = json.load(f)['classes']

def make_solid(r, g, b):
    arr = np.zeros((1, 3, 224, 224), dtype=np.float32)
    arr[0, 0, :, :] = r
    arr[0, 1, :, :] = g
    arr[0, 2, :, :] = b
    return arr

np.random.seed(42)

# 10 diverse non-rice synthetic/natural proxy inputs
test_cases = [
    ('Uniform skin tone (hand proxy)', make_solid(0.8, 0.6, 0.5)),
    ('Pure black image', np.zeros((1, 3, 224, 224), dtype=np.float32)),
    ('Pure white image', np.ones((1, 3, 224, 224), dtype=np.float32)),
    ('Gaussian random noise', np.clip(np.random.normal(0.5, 0.2, (1, 3, 224, 224)), 0, 1).astype(np.float32)),
    ('Blue sky gradient', np.tile(np.linspace(0.2, 0.8, 224, dtype=np.float32)[None, None, :, None], (1, 3, 1, 224))),
    ('Wood grain texture proxy', np.tile((np.sin(np.linspace(0, 20, 224))[:, None] * 0.3 + 0.5).astype(np.float32)[None, None, :, :], (1, 3, 1, 224))),
    ('Red cloth proxy', make_solid(0.9, 0.1, 0.1)),
    ('Soil / dirt brown proxy', make_solid(0.35, 0.25, 0.15)),
    ('Concrete gray wall proxy', make_solid(0.5, 0.5, 0.5)),
    ('Checkerboard pattern', np.tile((np.indices((224, 224)).sum(axis=0) % 2).astype(np.float32)[None, None, :, :], (1, 3, 1, 1)))
]

print("=" * 70)
print(" AgroLeaf AI — Non-Rice Input Abstention Test (10 cases)")
print("=" * 70)

results = []
for name, raw in test_cases:
    mean = np.array([0.485, 0.456, 0.406], dtype=np.float32).reshape(1, 3, 1, 1)
    std = np.array([0.229, 0.224, 0.225], dtype=np.float32).reshape(1, 3, 1, 1)
    norm = (raw - mean) / std

    outputs = session.run(None, {session.get_inputs()[0].name: norm.astype(np.float32)})[0][0]
    logits = outputs / temp
    exps = np.exp(logits - np.max(logits))
    probs = exps / np.sum(exps)

    top_idx = np.argmax(probs)
    top_prob = probs[top_idx]
    top_class = classes[top_idx]

    is_suppressed = top_class in suppress
    is_confident = (top_prob >= threshold) and not is_suppressed
    status = 'confident' if is_confident else 'not_sure'
    results.append((name, top_class, top_prob, status))
    print(f'{name:32s} -> {top_class:15s} ({top_prob:.2%}) => {status}')

not_sure_count = sum(1 for r in results if r[3] == 'not_sure')
print("-" * 70)
print(f'Total Abstentions (Not Sure): {not_sure_count}/10 ({not_sure_count*10}%)')
