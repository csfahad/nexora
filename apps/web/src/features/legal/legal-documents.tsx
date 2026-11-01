import { Link } from "@tanstack/react-router";
import type { LegalDocument } from "./legal-screen";

const Contact = () => (
    <a href="mailto:support@nexora.csfahad.in">support@nexora.csfahad.in</a>
);

export const TERMS: LegalDocument = {
    kind: "terms",
    title: "Terms of Service",
    description:
        "The ground rules for using Nexora, comparing AI models, and managing your account.",
    summary: [
        {
            title: "You make the call",
            text: "AI answers can be wrong. Check them before relying on them.",
        },
        {
            title: "Clear allowances",
            text: "Each model answer counts separately. Paid allowances refill monthly.",
        },
        {
            title: "Share deliberately",
            text: "Anyone with a share link can read the entire comparison.",
        },
    ],
    sections: [
        {
            id: "agreement",
            title: "Using Nexora",
            content: (
                <>
                    <p>
                        These Terms of Service govern your access to Nexora, operated by
                        Nexora in India. By using the service, you agree to these terms.
                        If you do not agree, do not use the service. Our{" "}
                        <Link to="/privacy">Privacy Policy</Link> explains how personal
                        information is processed.
                    </p>
                    <p>
                        You must be at least 18 years old and legally able to enter into
                        this agreement. If you use Nexora on behalf of an organization,
                        you confirm that you have authority to bind it to these terms.
                    </p>
                </>
            ),
        },
        {
            id: "account",
            title: "Your account",
            content: (
                <>
                    <p>
                        Sign in through Google or GitHub. You are responsible for keeping
                        your identity-provider account secure, for providing accurate
                        account information, and for activity performed through your
                        Nexora account.
                    </p>
                    <p>
                        Do not share access to your account, impersonate another person,
                        or create accounts to bypass limits. Contact <Contact /> if you
                        believe your account has been accessed without authorization.
                    </p>
                </>
            ),
        },
        {
            id: "service",
            title: "How the service works",
            content: (
                <>
                    <p>
                        Nexora lets you send a prompt to up to three eligible AI models,
                        compare their responses and measurements, save conversations, and
                        vote for an answer. Models are accessed through OpenRouter and its
                        downstream providers.
                    </p>
                    <p>
                        Models, availability, pricing, and supported capabilities can
                        change. A model shown in the catalog may be unavailable for
                        comparison or may require a paid plan. Individual responses can
                        fail, be delayed, or be limited by a provider.
                    </p>
                    <p>
                        Votes and measurements describe comparisons made through Nexora.
                        Rankings are observations from the available sample, not
                        certifications of a model’s quality or suitability for your task.
                        Provider-reported costs and identified estimates are not the price
                        of your subscription.
                    </p>
                </>
            ),
        },
        {
            id: "content",
            title: "Your content and AI answers",
            content: (
                <>
                    <p>
                        You retain the rights you have in prompts and other content you
                        provide. You give Nexora permission to process, store, transmit,
                        and display that content as needed to deliver the service,
                        including sending conversation context to the models you select
                        and processing it through our security and analytics services as
                        described in the Privacy Policy.
                    </p>
                    <p>
                        You must have the necessary rights and permissions for content you
                        submit. Do not submit confidential information or personal data
                        that you are not authorized to share with the services involved.
                    </p>
                    <p>
                        AI responses may be inaccurate, incomplete, biased, or similar to
                        responses generated for others. We do not guarantee that an answer
                        is original, lawful to reuse, or free of third-party rights.
                        Evaluate outputs yourself, especially before using them for
                        financial, legal, medical, security, or other consequential
                        decisions.
                    </p>
                </>
            ),
        },
        {
            id: "acceptable-use",
            title: "Acceptable use",
            content: (
                <>
                    <p>
                        Use Nexora lawfully and respect other people’s rights. You must
                        not:
                    </p>
                    <ul>
                        <li>
                            Submit unlawful content or use the service to facilitate
                            fraud, harassment, exploitation, or harm.
                        </li>
                        <li>
                            Attempt to access another person’s private threads, account,
                            or data.
                        </li>
                        <li>
                            Bypass authentication, rate limits, paid allowances, security
                            screening, or other access controls.
                        </li>
                        <li>
                            Disrupt the service, introduce malicious code, or automate
                            requests in a way that abuses its resources.
                        </li>
                        <li>
                            Manipulate voting or rankings through coordinated accounts or
                            fabricated comparisons.
                        </li>
                    </ul>
                    <p>
                        We may restrict requests or suspend access when needed to address
                        abuse, security concerns, or violations of these terms.
                    </p>
                </>
            ),
        },
        {
            id: "subscriptions",
            title: "Plans, payments, and renewal",
            content: (
                <>
                    <p>
                        The <Link to="/plans">Plans page</Link> describes current prices,
                        billing intervals, and answer allowances. A prompt sent to three
                        models can use three answers. Free answers have a daily allowance;
                        paid answers draw from the applicable Standard, Advanced, or
                        Frontier monthly allowance. Hourly limits and provider limits also
                        apply.
                    </p>
                    <p>
                        Dodo Payments acts as merchant of record for paid subscriptions
                        and handles checkout, taxes where applicable, payment methods,
                        invoices, and billing management. The amount and renewal interval
                        shown at checkout govern your purchase. Paid subscriptions renew
                        automatically unless canceled before renewal.
                    </p>
                    <p>
                        Annual subscriptions are billed for the year, while paid-model
                        allowances refill monthly. Unused allowances do not roll over. A
                        plan change can adjust your limits while preserving answers
                        already used in the current allowance window.
                    </p>
                    <p>
                        Manage or cancel a subscription through Billing and the billing
                        portal. Cancellation normally keeps access through the paid
                        period’s end. An answer that was already generated may count
                        toward usage even if you stop it. A failed request’s treatment
                        depends on whether it reached the provider.
                    </p>
                    <p>
                        Contact <Contact /> for payment errors or refund requests. Refund
                        eligibility depends on the circumstances, the applicable checkout
                        terms, and your statutory rights. These terms do not restrict any
                        refund or cancellation rights that applicable law requires.
                    </p>
                </>
            ),
        },
        {
            id: "sharing",
            title: "Sharing and deleting threads",
            content: (
                <>
                    <p>
                        Your saved threads are accessible through your account. If you
                        create a share link, anyone who receives it can read the whole
                        shared thread, including prompts, answers, measurements, and
                        recorded winners. They may copy its contents or forward the link.
                    </p>
                    <p>
                        You can revoke a share link or delete a thread using the available
                        controls. Revocation prevents future access through that link; it
                        cannot recall copies someone already made. Re-sharing creates a
                        new link. Deleting a thread does not automatically remove records
                        already held by providers, analytics services, or backups.
                    </p>
                </>
            ),
        },
        {
            id: "ownership",
            title: "The Nexora service",
            content: (
                <p>
                    Nexora’s software, interface, name, and original materials are
                    protected by applicable intellectual-property laws. These terms allow
                    you to use the service; they do not transfer ownership of it. Provider
                    names and logos belong to their respective owners and do not imply
                    endorsement of Nexora.
                </p>
            ),
        },
        {
            id: "availability",
            title: "Availability and responsibility",
            content: (
                <>
                    <p>
                        To the extent permitted by law, the service is provided “as is”
                        and “as available.” We do not guarantee uninterrupted access,
                        error-free measurements, particular AI outputs, or fitness for a
                        particular purpose. Third-party services may affect availability
                        independently of Nexora.
                    </p>
                    <p>
                        To the extent permitted by law, Nexora is not liable for indirect
                        or consequential losses, lost profits, or loss arising from
                        reliance on AI answers. Nexora’s total liability for claims
                        arising from the service is limited to the amount you paid Nexora
                        for the service during the 12 months before the event giving rise
                        to the claim.
                    </p>
                    <p>
                        Nothing in these terms excludes liability or limits rights that
                        cannot lawfully be excluded or limited, including applicable
                        consumer protections.
                    </p>
                </>
            ),
        },
        {
            id: "ending-access",
            title: "Ending access and changes",
            content: (
                <>
                    <p>
                        You may stop using Nexora at any time. Canceling a paid plan and
                        requesting account deletion are separate actions: cancel your
                        subscription through Billing, and contact <Contact /> for account
                        or data requests.
                    </p>
                    <p>
                        We may suspend or end access for material violations, security
                        threats, legal requirements, or discontinuation of the service.
                        Where practicable, we will explain the reason and provide a way to
                        contact us. Obligations already incurred, including payment
                        obligations, remain applicable.
                    </p>
                    <p>
                        We may update these terms as the service changes. The effective
                        date on this page identifies the current version. Material changes
                        will be communicated through the service or an appropriate account
                        channel. Continuing to use the service after the updated terms
                        take effect means you accept them.
                    </p>
                </>
            ),
        },
        {
            id: "law-contact",
            title: "Governing law and contact",
            content: (
                <>
                    <p>
                        These terms are governed by the laws of India, subject to
                        mandatory protections that apply where you live. Disputes are
                        subject to the jurisdiction of competent courts in India, without
                        limiting any non-waivable rights you have under applicable law.
                    </p>
                    <p>
                        For questions, complaints, or requests about these terms, contact
                        Nexora at <Contact />.
                    </p>
                </>
            ),
        },
    ],
};

export const PRIVACY: LegalDocument = {
    kind: "privacy",
    title: "Privacy Policy",
    description:
        "What Nexora collects, where your comparisons go, and the choices you have about your information.",
    summary: [
        {
            title: "Prompts reach providers",
            text: "Selected models receive your prompt and their conversation context.",
        },
        {
            title: "Analytics include content",
            text: "AI traces can contain prompts and answers; browser sessions may be recorded.",
        },
        {
            title: "You control share links",
            text: "Threads become readable to others when you create and share a link.",
        },
    ],
    sections: [
        {
            id: "who-we-are",
            title: "Who we are",
            content: (
                <>
                    <p>
                        Nexora, operated in India, is responsible for the personal
                        information it processes to provide the Nexora service. This
                        policy covers the website, accounts, model comparisons, saved
                        threads, voting, and subscriptions.
                    </p>
                    <p>
                        For privacy questions or requests, contact <Contact />. The{" "}
                        <Link to="/terms">Terms of Service</Link> cover the rules for
                        using Nexora.
                    </p>
                </>
            ),
        },
        {
            id: "information",
            title: "Information we collect",
            content: (
                <>
                    <p>
                        We collect information you provide, information produced when you
                        use the service, and information supplied by sign-in and payment
                        providers.
                    </p>
                    <div className="legal-table-wrap">
                        <table>
                            <caption>Information and its source</caption>
                            <thead>
                                <tr>
                                    <th scope="col">Category</th>
                                    <th scope="col">What it includes</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <th scope="row">Account</th>
                                    <td>
                                        Name, email address, profile image, user
                                        identifier, identity-provider account details, and
                                        authentication/session records from Google or
                                        GitHub sign-in.
                                    </td>
                                </tr>
                                <tr>
                                    <th scope="row">Comparisons</th>
                                    <td>
                                        Prompts, AI answers, thread titles, selected
                                        models, votes, timestamps, errors, and
                                        measurements such as token counts, response times,
                                        and costs.
                                    </td>
                                </tr>
                                <tr>
                                    <th scope="row">Billing</th>
                                    <td>
                                        Customer and subscription identifiers, plan,
                                        billing interval, subscription status, renewal
                                        dates, and usage allowances. Dodo Payments
                                        collects payment details through its checkout.
                                    </td>
                                </tr>
                                <tr>
                                    <th scope="row">Usage and device</th>
                                    <td>
                                        Page visits, interactions, browser and device
                                        details, IP or network information, performance
                                        data, diagnostics, and session recording or
                                        heatmap data where analytics are enabled.
                                    </td>
                                </tr>
                                <tr>
                                    <th scope="row">Support</th>
                                    <td>
                                        Messages and information you choose to provide
                                        when contacting us.
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </>
            ),
        },
        {
            id: "purposes",
            title: "Why we use it",
            content: (
                <>
                    <p>
                        We use information to authenticate accounts; generate and save
                        comparisons; calculate measurements and rankings; enforce
                        allowances; manage subscriptions; provide support; diagnose
                        errors; understand usage; improve the service; and detect or
                        prevent abuse.
                    </p>
                    <p>
                        Public rankings aggregate voting and response measurements.
                        Personal rankings use your own comparisons. Public standings do
                        not display your account identity or prompt text.
                    </p>
                    <p>
                        Where applicable law requires a legal basis, processing may be
                        necessary to provide the service you request, meet legal
                        obligations, protect legitimate interests such as security and
                        service improvement, or rely on consent where required. You may
                        contact us to ask about the basis for a particular use.
                    </p>
                </>
            ),
        },
        {
            id: "model-processing",
            title: "How prompts reach AI models",
            content: (
                <>
                    <p>
                        When you send a prompt, Nexora sends it through OpenRouter to the
                        providers serving the models you select. For a follow-up, each
                        model receives the earlier prompts and its own earlier answers
                        from that thread. It does not receive other models’ answers as
                        conversation context.
                    </p>
                    <p>
                        OpenRouter and downstream providers process this content under
                        their own policies and service terms. Retention, training, and
                        other data-use practices can vary by provider and configuration;
                        Nexora does not promise that every provider excludes your content
                        from training or stores it for the same period.
                    </p>
                    <p>
                        Do not enter sensitive or confidential information unless you are
                        comfortable with this processing and have permission to share it.
                        Review{" "}
                        <a
                            href="https://openrouter.ai/privacy"
                            target="_blank"
                            rel="noreferrer"
                        >
                            OpenRouter’s Privacy Policy
                        </a>{" "}
                        and the relevant model provider’s policy before submitting such
                        content.
                    </p>
                </>
            ),
        },
        {
            id: "service-providers",
            title: "Services that process information",
            content: (
                <>
                    <p>
                        Nexora uses external services to run the product. The following
                        describes the integrations currently present; each service may
                        also process operational information needed to deliver its
                        services.
                    </p>
                    <div className="legal-table-wrap">
                        <table>
                            <caption>Service providers and processing</caption>
                            <thead>
                                <tr>
                                    <th scope="col">Service</th>
                                    <th scope="col">Purpose and information</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <th scope="row">Google / GitHub</th>
                                    <td>
                                        Sign-in and identity verification. We receive
                                        account profile details and store authentication
                                        records.
                                    </td>
                                </tr>
                                <tr>
                                    <th scope="row">OpenRouter / model providers</th>
                                    <td>
                                        AI inference. Receive prompts and the relevant
                                        conversation history; return answers and usage
                                        details.
                                    </td>
                                </tr>
                                <tr>
                                    <th scope="row">PostHog</th>
                                    <td>
                                        Product analytics, heatmaps, browser session
                                        recording, and AI-generation traces. Traces can
                                        include prompt and answer content, model IDs,
                                        timing, usage, costs, and a user identifier.
                                        Signed-in analytics may associate activity with
                                        your name and email.
                                    </td>
                                </tr>
                                <tr>
                                    <th scope="row">Vercel</th>
                                    <td>
                                        Hosting, web analytics, and performance
                                        monitoring. May process requests, network/device
                                        information, page visits, and performance or
                                        diagnostic data.
                                    </td>
                                </tr>
                                <tr>
                                    <th scope="row">Arcjet</th>
                                    <td>
                                        Request security, abuse prevention, rate limiting,
                                        and prompt-injection screening. Processes
                                        request/network information, account identifiers
                                        used for limits, and prompt text for screening.
                                    </td>
                                </tr>
                                <tr>
                                    <th scope="row">Dodo Payments</th>
                                    <td>
                                        Merchant of record for checkout and subscription
                                        management. Processes payment and billing details
                                        and sends customer/subscription information to
                                        Nexora.
                                    </td>
                                </tr>
                                <tr>
                                    <th scope="row">Database infrastructure</th>
                                    <td>
                                        Storage of account, conversation, voting,
                                        subscription, and allowance records.
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <p>
                        We may also disclose information when required by law, to protect
                        rights and security, or in connection with a business transfer
                        subject to applicable safeguards. We do not sell your personal
                        information.
                    </p>
                </>
            ),
        },
        {
            id: "sharing-privacy",
            title: "Private threads and share links",
            content: (
                <>
                    <p>
                        Your threads are accessible through your account unless you create
                        a share link. Anyone with a valid link can view all content
                        currently included in that shared thread: prompts, answers,
                        measurements, and selected winners. This can include follow-ups
                        added after the link was created.
                    </p>
                    <p>
                        Shared pages are marked not to be indexed by search engines, but a
                        link is not a confidentiality guarantee. Recipients can copy,
                        screenshot, or forward content.
                    </p>
                    <p>
                        Revoking a link prevents further access through that link;
                        re-sharing creates a different one. Revocation and deletion cannot
                        remove copies already held by another person.
                    </p>
                </>
            ),
        },
        {
            id: "cookies",
            title: "Cookies, local storage, and analytics",
            content: (
                <>
                    <p>
                        Authentication uses cookies to maintain your session. Your
                        appearance preference is stored locally so Light, Dark, or System
                        can persist across visits. Analytics services may use cookies,
                        local storage, or similar identifiers to understand visits and
                        connect activity across a session.
                    </p>
                    <p>
                        PostHog is configured for browser session recording and heatmaps,
                        as well as product events and AI traces. Do not assume that
                        entering content into the app excludes it from analytics.
                        Recording behavior may depend on the analytics provider’s masking
                        and collection settings.
                    </p>
                    <p>
                        You can clear or block cookies and site storage in your browser.
                        Blocking essential cookies can prevent sign-in; privacy tools may
                        also block browser analytics. Browser controls do not stop
                        server-side processing of a submitted prompt. Contact <Contact />{" "}
                        to discuss privacy preferences or applicable consent and objection
                        rights.
                    </p>
                </>
            ),
        },
        {
            id: "retention",
            title: "Retention and deletion",
            content: (
                <>
                    <p>
                        We keep account information while needed to provide your account
                        and retain saved comparisons until you delete them or request
                        deletion, subject to legal, security, and operational needs.
                        Subscription and transaction-related records may need to be
                        retained for accounting, disputes, and legal obligations.
                    </p>
                    <p>
                        You can delete individual threads using the app’s controls.
                        Contact <Contact /> to request account deletion or deletion of
                        other personal information. We may need to verify that the request
                        comes from the account holder.
                    </p>
                    <p>
                        Deleting a thread from Nexora does not immediately remove
                        associated analytics events, provider records, operational logs,
                        or backup copies. Those records may follow separate retention
                        schedules. No universal automatic deletion period is currently
                        offered; contact us about a specific record or request.
                    </p>
                </>
            ),
        },
        {
            id: "security-transfers",
            title: "Security and international processing",
            content: (
                <>
                    <p>
                        We use access controls, authenticated sessions, request screening,
                        and other technical measures to protect information. No system or
                        transmission method is completely secure. Keep your sign-in
                        account secure and avoid sharing sensitive content unnecessarily.
                    </p>
                    <p>
                        Our providers may process information outside India or your
                        country of residence. Privacy laws may differ between countries.
                        Where applicable law requires safeguards for an international
                        transfer, we will use or require the appropriate safeguards.
                        Contact us for information about a particular transfer.
                    </p>
                </>
            ),
        },
        {
            id: "rights",
            title: "Your choices and rights",
            content: (
                <>
                    <p>
                        Depending on applicable law, you may have rights to access,
                        correct, receive a copy of, delete, restrict, or object to
                        processing of your personal information, withdraw consent where
                        processing relies on it, and raise a grievance or complaint with
                        the relevant authority.
                    </p>
                    <p>
                        You can manage saved threads and share links in the app, manage
                        subscriptions in Billing, and adjust browser storage permissions.
                        For other requests, email <Contact /> with the account email and a
                        description of your request. Do not send passwords or unnecessary
                        identity documents.
                    </p>
                    <p>
                        We may verify identity and may retain information when required or
                        permitted by law. We will respond in accordance with applicable
                        legal requirements and explain any limitations. A data-deletion
                        request does not itself cancel a paid subscription; manage
                        cancellation through Billing.
                    </p>
                </>
            ),
        },
        {
            id: "children-changes",
            title: "Children, changes, and contact",
            content: (
                <>
                    <p>
                        Nexora is intended for adults aged 18 and over. We do not
                        knowingly provide accounts to children. Contact us if you believe
                        a child has provided personal information so we can investigate
                        and take appropriate action.
                    </p>
                    <p>
                        We may update this policy when our processing or services change.
                        The effective date identifies the current version. Material
                        changes will be communicated through the service or an appropriate
                        account channel.
                    </p>
                    <p>
                        For questions, privacy requests, or grievances, contact Nexora at{" "}
                        <Contact />.
                    </p>
                </>
            ),
        },
    ],
};
