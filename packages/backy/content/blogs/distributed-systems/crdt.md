# why crdts?

Conflict-free Replicated Data Types (CRDTs) are a class of data structures that allow replicated data to be merged automatically, without conflicts. They are the backbone of many modern distributed systems.

> CRDTs guarantee that operations can be applied in any order, any number of times, on any replica, and still converge to the same state.

## core properties

A CRDT must satisfy three properties:

1. **Convergence:** all replicas converge to the same state.
2. **Commutativity:** operations can be applied in any order.
3. **Idempotence:** applying the same operation multiple times has the same effect.

## types of crdts

CRDTs are generally of two types:

- **State-based (CvRDTs):** replicas periodically exchange state.
- **Operation-based (CmRDTs):** replicas send operations.

## example: g-counter

A simple CRDT where the counter can only increment.

```ts
class GCounter {
  private counts: Map<string, number> = new Map();
  increment(nodeId: string, value = 1) {
    this.counts.set(nodeId, (this.counts.get(nodeId) || 0) + value);
  }
  value() {
    return Array.from(this.counts.values()).reduce((a, b) => a + b, 0);
  }
  merge(other: GCounter) {
    for (const [node, count] of other.counts) {
      this.counts.set(node, Math.max(this.counts.get(node) || 0, count));
    }
  }
}
```

## when to use crdts?

- Collaborative editing
- Offline-first apps
- Distributed counters, sets, maps, and more
