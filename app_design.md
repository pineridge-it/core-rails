# App Design Document: Leveraging Project Babbage Tools

## 1. Introduction

This document outlines the architectural design and functional specifications for an application built upon the Project Babbage tool-chain. The primary objective is to develop a robust and scalable platform that leverages the unique capabilities of the Bitcoin SV (BSV) blockchain, as exposed through the Babbage SDK, to enable innovative business models. The development will follow a phased approach, starting with core infrastructure and progressing to specific vertical market applications, as detailed in the provided roadmap.

## 2. Overall Architecture

The application's architecture will be modular and distributed, designed to maximize interoperability and leverage the decentralized nature of the BSV blockchain. It will consist of several key components:

*   **Client-Side Applications (Frontends):** These will be user-facing interfaces, primarily web-based (React) and potentially browser extensions, interacting with the backend services and directly with the user's BRC-100 compatible wallet.
*   **Backend Services:** These will provide the necessary APIs and business logic, acting as intermediaries between the client applications, the Babbage tool-chain components (like MessageBox and PeerPay servers), and the Overlay Services.
*   **Babbage Tool-Chain Components:** This includes the Metanet Desktop wallet (or a forked/branded version), public MessageBox and PeerPay servers, and custom Overlay Services.
*   **BSV Blockchain:** The underlying immutable ledger for all transactions, data storage, and smart contracts.

The interaction flow will generally involve client applications requesting actions from the user's wallet (e.g., signing transactions, encrypting data), communicating with backend services for business logic and data retrieval, and backend services interacting with Babbage components and the blockchain. Overlay Services will play a crucial role in indexing and providing queryable access to on-chain data, reducing the need for full blockchain scans.

## 3. Core Rails (Phase 1 Design)

Phase 1 focuses on establishing the fundamental infrastructure, or "Core Rails," that will support all subsequent vertical applications. This phase encompasses Wallet & Identity management, PeerPay Channels, Payment & Authentication middleware, and a generic Overlay Service skeleton.

### 3.1. Wallet & Identity

**Objective:** To provide secure user identity management and transaction capabilities through a BRC-100 compatible wallet.

**Components & Functionality:**

*   **Forked Metanet Desktop Wallet:** A customized version of the Metanet Desktop wallet will be used. This ensures control over branding and allows for specific feature exposure. The wallet will expose only the essential BRC-100 methods required for the initial phase:
    *   `createAction`: For initiating transactions.
    *   `signAction`: For signing partially constructed transactions.
    *   `getPublicKey`: For retrieving the user's public key for various purposes (e.g., encryption, identity verification).
    *   `encrypt`/`decrypt`: For secure data handling.
    *   `createSignature`: For digital signing of data.
*   **Certificates:** The system will integrate with certificate mechanisms to enable verifiable identity. Initially, this will involve:
    *   **SocialCert (email):** For basic email verification.
    *   **CoolCert (basic profile):** For managing fundamental user profile attributes.
    The wallet will manage the creation, presentation, and verification of these certificates, leveraging BRC-52 and BRC-53 for privacy-preserving selective disclosure.

**Interaction Flow:**

1.  Client applications will initiate requests to the user's wallet for actions such as transaction creation, data encryption, or identity verification. This interaction will adhere to the BRC-100 standard.
2.  The wallet will prompt the user for consent for sensitive operations.
3.  For certificate-related requests, the wallet will interact with designated certifiers (e.g., SocialCert, CoolCert) to obtain signed certificates or verify existing ones.
4.  The wallet will return the results (e.g., signed transaction, encrypted data, verified identity attributes) to the client application.

### 3.2. PeerPay Channels

**Objective:** To establish a robust and low-latency micropayment infrastructure.

**Components & Functionality:**

*   **Public MessageBox + PeerPay Servers:** These will be deployed using the default Babbage Docker compose setup. These servers are critical for enabling real-time, peer-to-peer messaging and integrated micropayments.
*   **Unit Testing:** Rigorous unit testing will be conducted to ensure the system can handle high transaction volumes (100 tx/s round-trips) with low latency (<500 ms) on the testnet. This will validate the scalability and performance of the micropayment channels.

**Interaction Flow:**

1.  Client applications or backend services will initiate payment requests through the PeerPay server.
2.  The PeerPay server will facilitate the creation and settlement of micropayments between parties.
3.  The MessageBox server will handle the underlying messaging required for PeerPay transactions, ensuring reliable delivery and persistence of payment-related messages.

### 3.3. Payment & Authentication Middleware

**Objective:** To provide a standardized and secure mechanism for handling payments and user authentication within the application.

**Components & Functionality:**

*   **Express API Integration:** A blank Express API will be used as the foundation for integrating PaymentExpress and AuthFetch. This will serve as the central point for handling authentication and payment flows.
*   **PaymentExpress:** This component will manage the 402 Payment Required flow, enabling services to request payment before providing access to resources. A "Hello World – $0.0002" endpoint will be implemented to demonstrate this flow.
*   **AuthFetch:** This component will handle user authentication, likely leveraging the identity capabilities of the Babbage wallet. It will enable secure login and authorization for various application features.

**Interaction Flow:**

1.  Client applications will attempt to access protected resources or services.
2.  The Express API, utilizing PaymentExpress, will intercept requests and, if payment is required, return a 402 status code.
3.  The client application will then initiate a payment through PeerPay.
4.  Upon successful payment, the client application will re-attempt the request, and AuthFetch will verify the user's authentication and authorization before granting access.

### 3.4. Overlay Service Skeleton

**Objective:** To establish a basic, extensible Overlay Service for indexing and querying on-chain data.

**Components & Functionality:**

*   **Backend Project Template:** The `backend-project-template` will be used as the starting point for developing the Overlay Service.
*   **Generic "receipt" Topic Manager:** A topic manager will be implemented to admit every basket spend. This means that any transaction where a UTXO from a named basket is spent will be tracked by this overlay.
*   **Lookup Service:** A lookup service will be developed to return usage logs based on the data collected by the topic manager. This will provide a basic mechanism for querying on-chain activity related to basket spends.
*   **MongoDB:** MongoDB will be used as the database for storing the indexed data from the blockchain. This provides flexibility and scalability for handling various types of on-chain data.

**Interaction Flow:**

1.  The topic manager will continuously monitor the BSV blockchain for relevant transactions (specifically, basket spends).
2.  Upon identifying a relevant transaction, the topic manager will process and store the associated data in MongoDB.
3.  Client applications or backend services will query the lookup service to retrieve usage logs or other indexed data related to basket spends.

### 3.5. Deliverable: "Developer Sandbox"

**Objective:** To provide a functional demonstration environment for the core rails.

**Components:**

*   **HTTP Echo API:** An API endpoint that costs $0.0002 per call, demonstrating the PaymentExpress 402 flow.
*   **React Demo Application:** A simple React application that:
    *   Authenticates users using AuthFetch.
    *   Initiates payments via PeerPay.
    *   Displays receipts from the Overlay Service.

This deliverable will serve as a proof-of-concept for the core infrastructure, allowing developers to experiment with the Babbage tool-chain and understand its capabilities in a practical context. This concludes the design for Phase 1. I will now proceed to design Phase 2, Vertical MVPs.



## 4. Vertical MVPs (Phase 2 Design)

Phase 2 focuses on developing Minimum Viable Products (MVPs) for three distinct vertical markets, leveraging the Core Rails established in Phase 1. Each MVP will demonstrate a specific business model enabled by the Babbage tool-chain.

### 4.1. Per-Second API Gateway

**Objective:** To enable monetization of API access on a per-second or per-call basis.

**Owner:** Backend-infra lead.

**Components & Functionality:**

*   **API Proxy:** A `api-proxy/*` route will be implemented to wrap any upstream REST API. This proxy will intercept API calls and integrate with the PeerPay system for monetization.
*   **PeerPay Integration:** On receiving a 402 (Payment Required) response from the API proxy, the system will call `PeerPay.requestInvoice()`. Upon successful payment, the upstream API response will be streamed back to the client.
*   **NPM Package (`@babbage/payg-api-client`):** A small NPM package with three functions will be developed to simplify adoption for developers. This client will handle the payment flow and interaction with the API gateway.
*   **Overlay Tables:** Two new overlay tables will be created:
    *   `api_call`: To log details of each API call, including timestamps, user IDs, and API endpoint.
    *   `balance_snapshot`: To record user balance snapshots, enabling auditing and reporting of API usage.
*   **Pilot APIs:** The system will be piloted with two public APIs: a free weather API and a freemium ML inference API, demonstrating both free and paid usage models.

**Interaction Flow:**

1.  A developer integrates the `@babbage/payg-api-client` into their application.
2.  The application makes an API call through the API proxy.
3.  If payment is required, the API proxy returns a 402 response.
4.  The `@babbage/payg-api-client` automatically requests an invoice from PeerPay.
5.  Upon successful payment, the API proxy streams the response from the upstream API.
6.  Details of the API call and balance changes are recorded in the `api_call` and `balance_snapshot` overlay tables.

### 4.2. Ad-Free "Pay-to-Skip" Web

**Objective:** To provide an ad-free web browsing experience through micropayments, sharing revenue with publishers.

**Owner:** Front-end lead.

**Components & Functionality:**

*   **Browser Extension (MV3):** A browser extension will be developed to intercept web pages. If ad metadata is present, it will replace the ads with a paywall overlay.
*   **AuthFetch Integration:** The extension will use AuthFetch to POST the page-hash to the backend server. The server will reply with a 402 if payment is required.
*   **DOM Rewriting:** On successful payment, the extension will rewrite the Document Object Model (DOM) to hide ads for a specified duration.
*   **Certificates for Publishers:** Publishers will sign their site-hash using certificates. The extension will check these certificates to prevent spoofing and ensure legitimate publishers are compensated.
*   **Revenue Sharing:** A revenue sharing model will be implemented, with 85% going to the publisher and 15% to the platform. Payouts will occur weekly via PeerPay.

**Interaction Flow:**

1.  A user navigates to a web page with the browser extension installed.
2.  The extension detects ads and displays a paywall overlay.
3.  The user opts to pay to skip ads.
4.  The extension sends the page-hash to the backend server via AuthFetch.
5.  The server requests payment via a 402 response.
6.  Upon successful payment, the extension rewrites the page DOM to hide ads.
7.  The publisher receives their share of the revenue via PeerPay.

### 4.3. On-Demand Micro-Tutoring & Q&A

**Objective:** To facilitate real-time, on-demand micro-tutoring and Q&A sessions with integrated micropayments.

**Owner:** Product lead.

**Components & Functionality:**

*   **Tutor Onboarding:** Tutors will onboard by uploading their CoolCert and optional professional certificates (verified by a self-hosted certifier). Their wallet will sign Terms of Service (TOS) and pricing (satoshi per minute/per reply), which will be stored in a `tutor_listing` overlay.
*   **Session Flow:**
    *   **Learner Selection:** Learners will select a tutor from the `tutor_listing` overlay.
    *   **MessageBox Room:** A MessageBox room will be opened for the session.
    *   **Per-Message Payment:** Every message exchanged in the chat will trigger `PeerPay.payMessage()` for micropayments.
    *   **Video Metering:** Video minutes will be metered via WebRTC statistics and debited from the learner's basket every 10 seconds.
*   **Dispute/Back-Office:** All receipts will be on-chain, enabling automatic refunds by spending the tutor's escrow basket if a rating falls below 3 stars.
*   **Niche Soft-Launch:** The service will soft-launch in a specific niche (e.g., Typescript help, IELTS speaking) with a limited number of tutors (<50).

**Interaction Flow:**

1.  A tutor registers and their details are stored in the `tutor_listing` overlay.
2.  A learner browses available tutors and selects one.
3.  A MessageBox chat room is initiated.
4.  Messages and video time are monetized via PeerPay.
5.  If a dispute arises, on-chain receipts facilitate automated refunds.

This concludes the design for Phase 2. I will now proceed to design Phase 3, Scale & Cross-Pollinate, and then summarize the overall plan.



## 5. Scale & Cross-Pollinate (Phase 3 Design)

Phase 3 focuses on expanding the platform's capabilities, fostering ecosystem growth, and exploring new monetization avenues by integrating additional Babbage components and business models.

### 5.1. Loyalty Tokens Integration

**Objective:** To introduce a loyalty token system that rewards users and encourages engagement across all three vertical applications.

**Components & Functionality:**

*   **Nano-Rewards:** Users will earn small, fungible loyalty tokens for various actions within the Per-Second API Gateway, Ad-Free Web, and Micro-Tutoring applications. These actions could include API calls, ad-skips, successful tutoring sessions, or positive ratings.
*   **Cross-App Usability:** The loyalty tokens will be designed to be usable across all three applications, allowing users to redeem them for discounts, premium features, or other benefits. This fosters a unified ecosystem and incentivizes continued engagement.
*   **BRC-46 Baskets:** Loyalty tokens will be managed within BRC-46 baskets in the user's wallet, ensuring secure and transparent tracking of rewards.
*   **Overlay Service for Loyalty:** A dedicated overlay service will be implemented to track the issuance, transfer, and redemption of loyalty tokens across the network. This provides a public, verifiable ledger of all loyalty token activity.

**Interaction Flow:**

1.  A user performs an action within any of the three applications that qualifies for a loyalty reward.
2.  The application, in conjunction with the user's wallet, issues a specified amount of loyalty tokens into the user's designated loyalty basket.
3.  The loyalty token issuance is recorded on the blockchain and indexed by the loyalty overlay service.
4.  Users can view their loyalty token balance and redeem them for benefits within any of the integrated applications.

### 5.2. Open Overlay & Certificate Specs

**Objective:** To attract third-party developers and services by open-sourcing the Overlay and Certificate specifications.

**Components & Functionality:**

*   **MIT Licensing:** The specifications for the custom Overlay Services (e.g., `receipt`, `api_call`, `balance_snapshot`, `tutor_listing`, and the new loyalty token overlay) and Certificate types (SocialCert, CoolCert, and any future professional certificates) will be released under an MIT license.
*   **Developer Documentation:** Comprehensive documentation will be provided to guide third-party developers on how to integrate with and build upon these open specifications. This will include API references, example code, and best practices.
*   **Community Engagement:** Efforts will be made to foster a developer community around the open specifications, encouraging contributions, feedback, and the development of new services that plug into the Babbage ecosystem.

**Impact:**

*   **Ecosystem Growth:** Open-sourcing the specifications will lower the barrier to entry for third-party developers, leading to a more vibrant and diverse ecosystem of applications and services built on Project Babbage.
*   **Increased Interoperability:** Standardized specifications will ensure that new services can seamlessly interact with existing components and data within the Babbage network.
*   **Innovation:** A larger developer community will drive innovation, leading to the creation of unforeseen applications and use cases for the Babbage tool-chain.

### 5.3. Hardware/IoT Pilots

**Objective:** To explore new business models and applications by integrating Babbage capabilities with hardware and IoT devices.

**Components & Functionality:**

*   **Real-Time Device Metering:** Once transaction volume justifies it, pilot programs will be initiated to meter real-time data from hardware and IoT devices (e.g., bandwidth usage, compute cycles) directly on the blockchain using micropayments.
*   **Specific Use Cases:** Initial pilots will focus on high-potential areas such as:
    *   **Bandwidth Monetization (#3):** Devices that consume or provide network bandwidth can be monetized on a per-unit basis.
    *   **Compute Monetization (#7):** Distributed computing resources can be offered and paid for based on actual usage.
*   **sCrypt Contracts:** Smart contracts written in sCrypt will be used to define and enforce the terms of these hardware-based transactions, ensuring automated and trustless execution.
*   **Overlay Services for IoT Data:** Dedicated overlay services will be developed to index and provide queryable access to the on-chain data generated by IoT devices, enabling real-time monitoring and analytics.

**Interaction Flow:**

1.  An IoT device performs an action (e.g., transmits data, executes a computation).
2.  The device, or an associated gateway, creates a microtransaction on the BSV blockchain, recording the usage.
3.  An sCrypt contract ensures the terms of the transaction are met and facilitates payment.
4.  The transaction data is indexed by a specialized IoT overlay service.
5.  Users or applications can query the overlay service to monitor device usage and associated costs.

## 6. Overall Task Plan Summary

This project will be executed in a phased approach, building from core infrastructure to specific market applications and then scaling for broader adoption and new use cases. The key phases are:

*   **Phase 1: Core Rails (Weeks 1-6):** Establish fundamental components including Wallet & Identity, PeerPay Channels, Payment & Authentication middleware, and a generic Overlay Service. Deliverable: "Developer Sandbox" with an HTTP echo API and a React demo.
*   **Phase 2: Vertical MVPs (Weeks 6-16):** Develop Minimum Viable Products for three verticals: Per-Second API Gateway, Ad-Free "Pay-to-Skip" Web, and On-Demand Micro-Tutoring & Q&A. Each MVP will demonstrate a specific business model and revenue target.
*   **Phase 3: Scale & Cross-Pollinate (Month 6+):** Expand capabilities by integrating loyalty tokens, open-sourcing specifications to attract third-party developers, and piloting hardware/IoT integrations.

Throughout all phases, emphasis will be placed on leveraging the Babbage tool-chain for secure, scalable, and micropayment-enabled solutions on the BSV blockchain. The development will be iterative, with continuous testing and refinement to ensure robust and user-friendly applications.

## 7. Mapping Babbage Components to Project Phases

The following table summarizes how key Babbage components will be utilized across the different phases of the project:

| Babbage Component | Where You’ll Use It Now (Phase 1 & 2) | Next Wave Use (Phase 3+) |
| :---------------- | :------------------------------------ | :----------------------- |
| WalletClient (BRC-100) | All logins, every transaction sign | Device baskets, loyalty tokens |
| AuthFetch | API gateway, browser extension | Any SaaS admin panel |
| PaymentExpress | 402 flow for APIs/pages | Pay-per-function IoT (#26) |
| PeerPay + MessageBox | Chat & per-message pay | Machine bounties (#24) |
| Overlay Service | Receipt index, tutor listings | Energy pulses, insurance triggers |
| Certificates | Tutor KYC, publisher verification | GDPR-grade consents (#5/#18) |
| Storage Uploader | Host documents, video clips | Live-event “moments” (#12) |
| sCrypt Contracts | Escrow + automatic refunds | Weather insurance (#30) |

## 8. Practical Tips & Considerations

*   **UTXO-based State:** Start every new state element as a UTXO, place it in a named basket, and only index it later if absolutely necessary. This leverages the native capabilities of the BSV blockchain for state management.
*   **Minimal Permission Prompts:** Keep permission prompts concise and bundle protocol, basket, and spending scopes per vertical to simplify the user experience.
*   **USD-Cent Equivalents:** Price services in USD-cent equivalents but settle in satoshis. Refresh exchange rates every 6 hours to avoid confusion and ensure stable pricing.
*   **Automated Revocation Flows:** Implement automated revocation flows early in the development process. This addresses potential user concerns about changing their mind or revoking access.

## 9. Milestone Timeline (Gantt-lite)

| Activity | Week 0 | Week 4 | Week 8 | Week 12 | Week 16 | Week 20 |
| :-------------------- | :----: | :----: | :----: | :-----: | :-----: | :-----: |
| Core Rails | ██████████ | | | | | |
| API Gateway | | | █████████ | | | |
| Pay-to-Skip | | | | ████████ | | |
| Micro-Tutoring | | | | | █████████ | |
| Biz Dev (publishers, tutors) | ░░░░░░░░░░░ | | | | | |
| SDK Docs & OSS | ███ | | █████ | | | |

This timeline provides a high-level overview of the project's progression. Business development and SDK documentation/open-sourcing will be ongoing activities throughout the development phases.

## 10. Conclusion

This document provides a comprehensive design for building an application ecosystem leveraging Project Babbage tools. By following this phased roadmap, the project aims to deliver innovative solutions for API monetization, ad-free web experiences, and micro-tutoring, while laying the groundwork for future expansion and ecosystem growth on the BSV blockchain. The emphasis on micropayments, decentralized identity, and on-chain state management positions this platform at the forefront of blockchain-enabled applications.


