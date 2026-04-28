# eventual consistency explained

Eventual consistency is a consistency model used in distributed computing that guarantees that, given enough time without updates, all replicas will converge to the same state.

## what is eventual consistency?

In an eventually consistent system:

- Updates are propagated asynchronously
- Replicas may return stale data in the short term
- All replicas will eventually converge to the same value

## cap theorem

Eventual consistency is often chosen when systems prioritize:

- **Availability** over strong consistency
- **Partition tolerance** over immediate consistency

## examples

Common systems using eventual consistency:

- DNS (Domain Name System)
- Amazon DynamoDB
- Cassandra
- Riak

## crdts and eventual consistency

CRDTs can guarantee eventual consistency by ensuring that:

1. All operations commute
2. The state converges regardless of delivery order
3. Conflicts are resolved automatically
