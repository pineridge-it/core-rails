# Project Babbage Documentation

## Table of Contents

1. [Introduction](#introduction)
2. [Wallets](#wallets)
3. [Apps](#apps)
4. [Baskets & State Management](#baskets--state-management)
5. [Overlays](#overlays)
6. [Contracts](#contracts)
7. [Storage](#storage)
8. [Certificates](#certificates)
9. [Micropayments](#micropayments)
10. [Trust](#trust)
11. [Peer-to-Peer Messaging](#peer-to-peer-messaging)
12. [Developer Guides](#developer-guides)

---

## Introduction

These concepts provide solid grounding in wallets, apps, overlays, contracts, storage, certificates, micropayments, and trust within the BSV ecosystem. By reading these, you'll understand the "why" behind each component—how they interact, what design principles guide them, and how they support scalable, secure development.

---

## Wallets

### Overview of Wallets in Project Babbage

A wallet in the BSV Blockchain ecosystem is software that manages your private keys, identity, tokens, and more—serving as the user's command center for all things on the blockchain. Unlike simple cryptocurrency wallets that just receive and send coins, the newest BSV wallets (especially those aligning with BRC-100) go much further. They act as gateways enabling:

#### Transaction Creation & Management

- **Spending Authorization**: Your wallet can facilitate the creation and signing of transactions (e.g., with BRC-1), whether you're sending BSV or other tokenized outputs.
- **Basket-Based UTXO Management**: Wallets can group outputs in baskets (BRC-46), making it easy for apps to insert new token outputs or spend them in a secure, permissioned fashion. Think: "Game tokens in a game assets basket," or "loyalty points in a points basket."

#### Identity & Certificates

- **Identity Key Management**: The wallet maintains secure identity keys for each user. This lies at the heart of letting you "log in" across many apps without usernames or passwords.
- **Certificate Creation & Revelation**: Under BRC-52 and BRC-53, wallets help create, present, or verify identity certificates (e.g., proving "I have a valid driver's license" or "I'm over 18").
- **Selective Revelation**: You choose which fields to disclose, preserving privacy and letting an application confirm only what's needed (like just the "DOB" from your government-issued certificate).

#### Data Encryption & Secure Messaging

- **Encryption/Decryption**: By deriving keys for specific operations (BRC-2), the wallet can encrypt data for a specific recipient.
- **Digital Signatures**: Similarly, the wallet can sign messages, documents, or even microtransactions, verifying your authenticity.
- **HMAC Creation & Verification**: For integrity checks (BRC-56 HMACs), your wallet can produce and verify cryptographic hashes that prove data has not been altered.

#### Open, Vendor-Neutral Interface (BRC-100)

The BRC-100 standard defines a consistent API for any application to talk to any wallet—no more one-off integrations. This uniformity covers:

- Getting & listing outputs
- Creating or signing partially built transactions
- Fetching derived public keys from the user (for encryption or token protocols)
- Handling certificates and selective identity revelation
- Managing baskets of tokens & advanced labeling or tagging

#### Trust Network & Identity Resolution

BSV wallets respect the user's own trust preferences. You configure who you trust to certify your identity or the identities of others.

If an app says, "Please show me you're a verified pilot," your wallet checks whether your certificates from a certifier you trust (or that the app trusts) are valid, and only then optionally reveals that attribute or field.

### A Real-World Example: Metanet Desktop Wallet

Projects like the Metanet Desktop (open-sourced by the BSV Association) give you a modern wallet that fully embraces these concepts:

- You have baskets for storing tokens.
- You carry identity certificates that you can selectively reveal.
- You can sign, encrypt, or create transactions, all in one place.
- Crucially, it implements the BRC-100 wallet-to-app standard so any developer building on BRC-100 can integrate with it.

### Developer Perspective: Wallet Client from the TypeScript SDK

To help you—and your application—tap into every bit of wallet functionality, the Wallet Client (part of the TypeScript SDK) exposes a simple interface. You can:

- Create actions (transactions) or partially constructed ones for later signing (so apps can gather multiple participants).
- Fetch or spend tokens from a basket.
- Encrypt and decrypt data with ephemeral keys.
- Obtain or verify identity certificates on behalf of the user, referencing their personal trust network.

Behind the scenes, it uses the BRC-100 specification so your code remains portable across any conformant wallet.

---

## Apps

### How apps function in the Project Babbage ecosystem

In the BSV Blockchain ecosystem, an App is more than just a piece of software that uses the BSV blockchain. It follows specific standards for its codebase structure and how it communicates with wallets, deployment metadata, and guides users through permission requests.

#### Core Concepts

##### Deployment Metadata

Every App should define its deployment metadata in a `deployment-info.json` file. BRC-102 provides a standardized structure so wallets, services, and other tools can quickly parse an App's declared resources and launch configurations (e.g., local dev with LARS, deployment in the cloud with CARS).

##### App Manifest and Permissions

Frontends deployed online typically have a `manifest.json` that describes what permissions they require from users. Whether that's the ability to spend a certain amount of satoshis, read certificate fields, or interact with specific baskets of UTXOs, you can structure these permissions systematically. Group Permissions (described by BRC-73) also go here, making it simpler for users to approve or deny.

##### Wallet Interaction

Apps talk to wallets using vendor-neutral messaging layers. BRC-100 outlines the unified abstract approach for calling wallet functions like transaction creation or data decryption. Wallets like Metanet Desktop use this standard.

##### Overlay Services

Apps can be frontend-only, backend-only, or both. If they have a backend folder, it describes one or more topic managers and lookup services responsible for tracking and managing the tokens it creates on the network.

#### Curation of UTXOs and Tokens

Apps often rely on tokens or specialized transaction outputs to enable unique user experiences, like digital goods, loyalty points, etc:

- **Basket Model**: BRC-46 groups outputs into "baskets" so an App can quickly locate or manage only the tokens relevant to its functionality.
- **Advanced Permission Schemes**: For future-proofing and extra security control over digital assets, upcoming standards like BRC-99 let you define specialized "basket IDs" and rules that determine who can spend or view them.

#### Why Build on the Metanet?

##### User Trust & Simplicity

By implementing a standardized manifest and permission flow, you're fostering trust. Users understand precisely what they're granting, and the wallet can solicit clear, consistent prompts.

##### Interoperability & Future-Proofing

Thanks to a standardized approach, your App naturally works across different wallets that follow the same open protocols. As new permission systems evolve, your App can adopt them seamlessly.

##### Reduced Development Overhead

No need to tailor separate flows for each wallet or custom lifecycle. By referencing BRC documents, you can code once and cover every compliant wallet integration immediately.

---

## Baskets & State Management

### Learn about baskets and state management in Metanet apps

#### What is a "basket"?

In a BRC-100-compatible wallet, a basket is nothing more than a named collection of unspent transaction outputs (UTXOs) that the wallet deliberately tracks on behalf of a user.

The idea originates in BRC-46 "Wallet Transaction Output Tracking (Output Baskets)", which extends the normal transaction-creation flow with a simple extra field:

```json
{
  "outputs": [{
    "script": "<locking-script>",
    "satoshis": 1000,
    "basket": "todo tokens",
    "customInstructions": "{ … }"
  }]
}
•	When the wallet broadcasts this transaction it also stores the resulting output in the named basket.
•	Later, an app can ask for every UTXO that still sits in that basket via a Transaction-Outputs Request.
•	Spending or explicitly removing the output takes it out of the basket.
Think of a basket as the on-chain equivalent of a labelled folder on your computer: you know exactly which files (outputs) are inside, you can hand selective access to other applications, and you can remove items when they are no longer needed.
Why do baskets matter?
Baskets give developers a standard, vendor-neutral way to keep application state on Bitcoin—in pure UTXO form—without building a bespoke database or indexer.
They unlock three major benefits:
Self-contained tokens
•	BRC-45 formalises the idea that an output itself is a token.
•	By grouping related outputs into a basket you implicitly declare: "Every token in here follows the same spending rules."
•	That lets generic software modules reuse the same unlock logic over and over.
User-centred permissions
•	Access to a basket is granted on a per-application basis by the wallet.
•	A budgeting tool may see budget baskets while a game only sees its game items basket—no cross-contamination.
Zero external dependencies
•	As long as the user keeps a BRC-100 wallet, the data lives with them.
•	No third-party indexers, no central servers, no state channels to maintain.
State-Management Models in Metanet Apps
While baskets are perfect for local state, many apps also need collaborative or global coordination. In practice we see three canonical models:
Model	Where is the UTXO kept?	Who can update it?	Typical comms layer
Local	In a basket inside one user's wallet	Only that user	Local wallet — @bsv/sdk's WalletClient
Direct (Peer-to-Peer)	Outputs bounce between two wallets	Exactly the two peers	Message Box — @bsv/p2p's MessageBoxClient
Global (Overlay Service)	Tracked by a network overlay	Many independent parties	Overlay TopicBroadcaster and LookupResolver (BRC-22 family)
1. Local basket example — Personal To-Do List
•	The to-do app asks the wallet to create one output per task, all tagged basket = "todo tokens".
•	At launch it calls Transaction-Outputs Request and renders every UTXO as a task item.
•	When the user checks a task as "done", the app spends the output—removing it from the basket automatically.
•	No other user is involved, so no external coordination is needed.
2. Direct example — Two-player Coin-Flip
•	Alice and Bob each fund a smart-contract output (e.g., an sCrypt "coin flip" script).
•	They exchange transactions through an encrypted message box.
•	Each update produces a new output; ownership alternates until the final spend pays the winner.
•	Because only Alice and Bob need those updates, baskets aren't required—yet the concept of outputs as state still applies.
3. Global example — 3D Model Marketplace
•	Every time a creator lists a model, their wallet emits an output that encodes the listing terms.
•	A dedicated Overlay Service tracks this specific type of marketplace listing outputs across the whole network, maintaining a searchable catalogue.
•	The app lets buyers pull the latest listing UTXOs from the overlay, decode them, and contact the seller for the purchase.
•	Here, the overlay curates a single source of truth yet the state remains on-chain as first-class UTXOs.
Choosing the right model
If your app...	Consider
Needs solo user data that rarely leaves one device	Local basket
Involves two fixed parties negotiating a shared contract	Direct P2P
Must show public or multi-party data, or enforce scarce items	Overlay
You can, of course, mix and match. A game might track player inventory in local baskets, run head-to-head duels through direct channels, and publish matchmaking info via an overlay.
________________________________________
Overlays
Overlays serve as specialized layers on top of the BSV blockchain
Overlay services are an essential piece of BSV's architecture that make it far easier to build scalable applications without needing to index the entire blockchain.
What Are Overlay Services?
Overlay services are specialized application-focused layers that run "on top" of the base BSV network. Each overlay service tracks only the specific transactions or data that are relevant to its own focus (its "topic"), storing and making that data queryable via a standard API.
•	Topic Managers: The code that decides which new transactions get admitted into the overlay's state and which known records get removed or updated. Essentially, this logic filters out everything that's irrelevant to your app.
•	Lookup Services: The code that provides a query endpoint for the data the topic manager has collected. Instead of you scanning the entire blockchain, you simply ask the overlay's "lookup" API for exactly what you need.
By combining these two parts, an overlay service appears to your app as though it's a normal database, but under the hood it remains grounded in the BSV blockchain. All admitted data is backed by Simplified Payment Verification (SPV) to ensure it's genuinely confirmed on-chain.
When Do You Use Overlay Services?
Overlay services come into play any time you want to build an application that needs shared or global state, or that must track particular outputs on the BSV blockchain without scanning it all:
You need to manage on-chain data for many users
If your app deals with tokens, counters, auctions, user entries, or any multi-user state, you can have an overlay track that data so all your users see the same, consistent global view.
You require queries beyond a single user's scope
A user's own wallet can track data that belongs specifically to them, but for a cross-user application (e.g., leaderboards, a market of items, or game states), you need a broader vantage point. An overlay's lookup service can answer global queries so every participant sees "the big picture."
You want strong SPV-backed assurance
Because overlay services rely on real blockchain confirmations and SPV proofs, they provide a verifiable record of transactions, bridging your app logic with unforgeable on-chain data integrity.
You'd prefer not to ingest the entire blockchain
Instead of running a full node or building a custom indexer, overlays let you track precisely the outputs and transactions you care about. This drastically reduces overhead, which matters for large-scale or specialized applications.
Why Are They Helpful?
Scalability
Rather than one node doing all the heavy lifting of scanning the entire blockchain for every possible use case, the workload is split across many overlay services—each focusing on its own topic. This approach scales as BSV's transaction volume grows.
Rapid Development
An overlay service acts like a typical backend microservice. Your front end can talk to it via familiar REST or HTTP-based calls:
•	/submit to send transactions related to your topic.
•	/lookup to retrieve or filter the data your app needs.
Meanwhile, the service automatically filters away everything irrelevant, so you don't have to build a custom index or handle raw blockchain parsing.
Custom Logic and Data
You can implement precisely the topic logic your application needs. For example, if you have a "MeterCounter" app that increments numbers on-chain, you define a topic manager that admits only those "counter" transactions. This custom vantage point makes development far more streamlined—your overlay is effectively a "custom node," but only for your corner of the data.
Distributed Ownership & Public or Private
Multiple overlays can exist to serve different user groups, or to provide redundancy if one goes down. You could keep your overlay private—only you see your data—or opt to run a public overlay that anyone can query. A business might maintain a private overlay for internal data and provide a partial read-only public lookup if that suits their model.
SPV Security
Overlays rely on the base BSV blockchain for proofs of validity. They do not need to become "trusted authorities." Clients can trust the overlay is only storing
(Content truncated due to size limit. Use page ranges or line ranges to read remaining content)