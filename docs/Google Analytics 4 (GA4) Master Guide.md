# Google Analytics 4 (GA4) Master Guide

## Table of Contents

1. [Core Concepts](#core-concepts)  
2. [Advanced Configuration](#advanced-configuration)  
3. [Event Tracking](#event-tracking)  
4. [Custom Dimensions & Metrics](#custom-dimensions--metrics)  
5. [Explorations & Reporting](#explorations--reporting)  
6. [Integrations](#integrations)  
7. [API & Automation](#api--automation)

## Core Concepts

### GA4 vs Universal Analytics

- **Event-based model**: All interactions are events  
- **Enhanced measurement**: Automatic tracking of scrolls, outbound clicks, site search, video engagement  
- **User-centric**: Focus on user journey rather than session-based metrics  
- **Machine learning**: Predictive metrics and automated insights

### Key Metrics & Dimensions

- **Engagement Rate**: (Engaged sessions / Sessions) × 100  
- **Engagement Time**: Time users spend actively engaging with content  
- **Event Count**: Total number of events triggered  
- **Conversions**: Events marked as conversions  
- **Revenue**: E-commerce and subscription revenue

## Advanced Configuration

### Property Setup Checklist

- [ ] Create GA4 property  
- [ ] Configure data streams (Web, iOS, Android)  
- [ ] Set up data retention (14, 26, 38, 50 months)  
- [ ] Configure data filters (internal traffic, bot filtering)  
- [ ] Set up currency and timezone  
- [ ] Enable Google Signals for cross-device tracking  
- [ ] Configure consent mode (if required)

### Data Stream Configuration

#### Web Data Stream

Settings → Data Streams → \[Your Stream\] → Configuration

\- Measurement ID: G-XXXXXXXXXX

\- Enhanced measurement: Enable all relevant events

\- DebugView: Enable for testing

#### Enhanced Measurement Events

- **Page views**: Automatic  
- **Scrolls**: 90% threshold (configurable)  
- **Outbound clicks**: Automatic  
- **Site search**: Automatic (requires parameter detection)  
- **Video engagement**: Automatic (YouTube, Vimeo)  
- **File downloads**: Automatic (PDF, DOC, etc.)

### Data Filters

#### Internal Traffic Filter

Admin → Data Settings → Data Filters → Create Filter

\- Filter name: "Internal Traffic"

\- Filter type: Internal traffic

\- IP addresses: \[Your office IPs\]

\- Apply to: All events

#### Bot Filtering

Admin → Data Settings → Data Filters

\- Enable "Exclude known bots and spiders"

## Event Tracking

### Standard Events

GA4 automatically tracks these events:

- `page_view`  
- `scroll`  
- `click`  
- `view_search_results`  
- `video_start`, `video_progress`, `video_complete`  
- `file_download`

### Recommended Custom Events

#### E-commerce Events

// Purchase event

gtag('event', 'purchase', {

  'transaction\_id': 'T12345',

  'value': 29.99,

  'currency': 'USD',

  'items': \[{

    'item\_id': 'SKU123',

    'item\_name': 'Product Name',

    'category': 'Category',

    'quantity': 1,

    'price': 29.99

  }\]

});

// Add to cart

gtag('event', 'add\_to\_cart', {

  'currency': 'USD',

  'value': 19.99,

  'items': \[{

    'item\_id': 'SKU123',

    'item\_name': 'Product Name',

    'category': 'Category',

    'quantity': 1,

    'price': 19.99

  }\]

});

#### Engagement Events

// Form submission

gtag('event', 'form\_submit', {

  'form\_name': 'Contact Form',

  'form\_location': 'Homepage'

});

// Newsletter signup

gtag('event', 'sign\_up', {

  'method': 'Email'

});

// Video engagement

gtag('event', 'video\_progress', {

  'video\_title': 'Product Demo',

  'video\_duration': 120,

  'video\_percent': 50

});

### Event Parameters

#### Standard Parameters

- `currency`: ISO 4217 currency code  
- `value`: Monetary value  
- `items`: Array of item objects  
- `transaction_id`: Unique transaction identifier

#### Custom Parameters

gtag('event', 'custom\_event\_name', {

  'custom\_parameter\_1': 'value1',

  'custom\_parameter\_2': 'value2',

  'engagement\_time\_msec': 5000

});

## Custom Dimensions & Metrics

### Custom Dimensions

#### User-Scoped Dimensions

Admin → Custom Definitions → Custom Dimensions → Create

\- Dimension name: "User Type"

\- Scope: User

\- Event parameter: user\_type

\- Description: "Type of user (free, premium, enterprise)"

#### Event-Scoped Dimensions

\- Dimension name: "Content Category"

\- Scope: Event

\- Event parameter: content\_category

\- Description: "Category of content viewed"

### Custom Metrics

#### Event-Scoped Metrics

Admin → Custom Definitions → Custom Metrics → Create

\- Metric name: "Engagement Score"

\- Scope: Event

\- Event parameter: engagement\_score

\- Unit: Standard

\- Description: "Calculated engagement score"

### Best Practices

- **Naming**: Use snake\_case for parameters  
- **Limits**: 50 custom dimensions, 50 custom metrics per property  
- **Scope**: Choose appropriate scope (User, Event, Item)  
- **Documentation**: Document all custom dimensions/metrics

## Explorations & Reporting

### Exploration Types

#### Free Form

- Drag-and-drop interface  
- Custom tables and charts  
- Multiple dimensions and metrics  
- Filtering and segmenting

#### Funnel Exploration

- Visualize user journey  
- Identify drop-off points  
- Conversion path analysis  
- Step-by-step breakdown

#### Path Exploration

- User navigation paths  
- Entry and exit points  
- Most common paths  
- Path analysis by segment

#### Segment Overlap

- Compare multiple segments  
- Identify overlapping audiences  
- Audience intersection analysis  
- Segment comparison

#### User Explorer

- Individual user journeys  
- User-level event data  
- User lifetime value  
- Cohort analysis

### Creating Effective Explorations

#### Conversion Funnel Example

1\. Create Funnel Exploration

2\. Add steps:

   \- Step 1: page\_view (Landing Page)

   \- Step 2: view\_item (Product Page)

   \- Step 3: add\_to\_cart (Cart)

   \- Step 4: begin\_checkout (Checkout)

   \- Step 5: purchase (Conversion)

3\. Apply segments (e.g., traffic source)

4\. Analyze drop-off rates

### Audience Triggers

#### Creating Audience Triggers

Admin → Audiences → New Audience → Create Custom

\- Audience name: "High-Value Customers"

\- Conditions:

  \- Event: purchase

  \- Parameter: value \> 100

  \- Timeframe: Last 30 days

\- Membership duration: 90 days

#### Audience Types

- **Predefined**: Demographics, interests, technology  
- **Custom**: Event-based, user properties, conditions  
- **Smart**: ML-powered predictive audiences

## Integrations

### Google Ads Integration

#### Linking Google Ads to GA4

Admin → Google Ads Links → Link → Select Google Ads Account

\- Enable: "Import site metrics"

\- Enable: "Import cost data"

\- Enable: "Import conversions"

#### Conversion Import

Admin → Google Ads Links → \[Your Link\] → Conversion Import

\- Select GA4 events to import as conversions

\- Map conversion values

\- Set conversion windows

### BigQuery Integration

#### Enabling BigQuery Export

Admin → BigQuery Linking → Link → Select BigQuery Project

\- Daily export: Enabled

\- Streaming export: Enabled (recommended)

\- Location: \[Your region\]

#### BigQuery Schema

- `events_*` tables: Event data  
- `users_*` tables: User data  
- `items_*` tables: Item data (e-commerce)

### Google Tag Manager Integration

#### GA4 Configuration Tag

GTM → Tags → New → Google Analytics: GA4 Configuration

\- Measurement ID: G-XXXXXXXXXX

\- Fields to set:

  \- user\_id: {{User ID}}

  \- custom\_map: {{Custom Map}}

\- Triggers: All Pages

#### GA4 Event Tag

GTM → Tags → New → Google Analytics: GA4 Event

\- Configuration Tag: \[Your GA4 Config Tag\]

\- Event Name: {{Event Name}}

\- Event Parameters: {{Event Parameters}}

\- Trigger: \[Your Trigger\]

## API & Automation

### GA4 Data API

#### Authentication

// Service account authentication

const {GoogleAuth} \= require('google-auth-library');

const auth \= new GoogleAuth({

  keyFile: 'path/to/service-account-key.json',

  scopes: \['https://www.googleapis.com/auth/analytics.readonly'\]

});

#### Running Reports

const {BetaAnalyticsDataClient} \= require('@google-analytics/data');

const analyticsDataClient \= new BetaAnalyticsDataClient({

  keyFile: 'path/to/service-account-key.json'

});

async function runReport() {

  const \[response\] \= await analyticsDataClient.runReport({

    property: \`properties/${PROPERTY\_ID}\`,

    dateRanges: \[

      {

        startDate: '2024-01-01',

        endDate: 'today',

      },

    \],

    dimensions: \[

      {name: 'country'},

      {name: 'city'},

    \],

    metrics: \[

      {name: 'activeUsers'},

      {name: 'conversions'},

    \],

  });

  console.log('Report result:', response);

}

### Admin API

#### Managing Custom Dimensions

const {AnalyticsAdminServiceClient} \= require('@google-analytics/admin');

const adminClient \= new AnalyticsAdminServiceClient({

  keyFile: 'path/to/service-account-key.json'

});

async function createCustomDimension() {

  const \[dimension\] \= await adminClient.createCustomDimension({

    parent: \`properties/${PROPERTY\_ID}\`,

    customDimension: {

      parameterName: 'content\_category',

      displayName: 'Content Category',

      scope: 'EVENT',

      description: 'Category of content viewed',

    },

  });

  console.log('Created dimension:', dimension);

}

### Automation Use Cases

#### Daily Performance Report

- Extract key metrics (sessions, conversions, revenue)  
- Compare to previous period  
- Identify anomalies  
- Send email report

#### Audience Refresh

- Query user segments  
- Update audience membership  
- Export to Google Ads  
- Refresh lookalike audiences

#### Conversion Optimization

- Analyze conversion paths  
- Identify high-value segments  
- Update bid strategies  
- Adjust campaign budgets

## Best Practices

### Data Quality

1. **Test before launch**: Use DebugView for all events  
2. **Validate parameters**: Ensure correct data types  
3. **Monitor data**: Set up alerts for anomalies  
4. **Document everything**: Maintain event catalog

### Performance

1. **Limit custom dimensions**: Use only what's needed  
2. **Optimize queries**: Use appropriate date ranges  
3. **Cache results**: Store frequently accessed data  
4. **Batch operations**: Group API calls when possible

### Privacy & Compliance

1. **Consent mode**: Implement for GDPR/CCPA  
2. **Data retention**: Set appropriate retention periods  
3. **User deletion**: Implement user data deletion  
4. **IP anonymization**: Enable when required

## Troubleshooting

### Common Issues

#### Events Not Appearing

- Check DebugView for real-time validation  
- Verify GTM triggers are firing  
- Confirm measurement ID is correct  
- Check data filters aren't excluding data

#### Missing Conversions

- Verify events are marked as conversions  
- Check conversion import settings  
- Confirm attribution windows  
- Validate conversion values

#### Data Discrepancies

- Account for sampling in large datasets  
- Check timezone settings  
- Verify date range selections  
- Compare with source data

---

**Next Steps**:

- Review [GTM Documentation](http://../gtm/README.md) for tag implementation  
- Check [Methodologies](http://../methodologies/README.md) for optimization strategies  
- See [Templates](http://../templates/tagging-plans.md) for implementation examples

# Google Ads Master Guide

## Table of Contents

- [Campaign Structure](#campaign-structure)  
- [Campaign Types](#campaign-types)  
- [Ad Creation](#ad-creation)  
- [Extensions](#extensions)  
- [Audiences & Targeting](#audiences--targeting)  
- [Bidding Strategies](#bidding-strategies)  
- [Optimization](#optimization)  
- [Automation](#automation)

## Campaign Structure

### Hierarchy

Account

├── Campaign

│   ├── Ad Group

│   │   ├── Keywords (Search)

│   │   ├── Placements (Display/Video)

│   │   ├── Ads

│   │   └── Extensions

│   └── Settings

└── Shared Library

    ├── Audiences

    ├── Negative Keyword Lists

    ├── Attribution Models

    └── Bid Strategies

### Naming Conventions

#### Campaigns

\[Channel\] \- \[Objective\] \- \[Audience\] \- \[Date\]

Examples:

\- Search \- Brand \- Exact \- 2024Q1

\- Display \- Retargeting \- Cart Abandoners \- 2024Q1

\- Video \- Awareness \- Lookalike \- 2024Q1

\- PMax \- Conversion \- All Products \- 2024Q1

#### Ad Groups

\[Theme\] \- \[Match Type\] \- \[Priority\]

Examples:

\- Brand Terms \- Exact \- High

\- Product Category \- Phrase \- Medium

\- Competitor Terms \- Broad \- Low

#### Ads

\[Type\] \- \[Variant\] \- \[Version\]

Examples:

\- RSA \- Headline 1 \- V2

\- Static \- Image A \- V1

\- Video \- 30s \- V1

## Campaign Types

### Search Campaigns

#### Best For

- High-intent keywords  
- Brand awareness  
- Direct response  
- Lead generation

#### Structure

Campaign: Search \- \[Objective\]

├── Ad Group: \[Theme\] \- Exact

│   ├── Keywords: \[exact match\]

│   ├── Keywords: \[phrase match\]

│   └── Ads: 3-5 RSAs

├── Ad Group: \[Theme\] \- Phrase

│   ├── Keywords: \[phrase match\]

│   └── Ads: 3-5 RSAs

└── Ad Group: \[Theme\] \- Broad

    ├── Keywords: \[broad match\]

    └── Ads: 3-5 RSAs

### Display Campaigns

#### Best For

- Brand awareness  
- Remarketing  
- Visual products  
- Broad reach

#### Targeting Options

- **Audiences**: Demographics, interests, in-market  
- **Placements**: Specific websites, apps, YouTube  
- **Topics**: Content topics  
- **Keywords**: Contextual targeting

### Video Campaigns (YouTube)

#### Campaign Goals

- **Awareness**: Video views, reach  
- **Consideration**: Engagement, website traffic  
- **Conversion**: Conversions, leads

#### Ad Formats

- **Skippable in-stream**: 6-second skip option  
- **Non-skippable in-stream**: 15-20 seconds  
- **Bumper ads**: 6 seconds, non-skippable  
- **Discovery ads**: YouTube search/watch pages

### Performance Max

#### Best For

- E-commerce  
- Multi-channel goals  
- Automated optimization  
- Full-funnel campaigns

#### Asset Requirements

- **Headlines**: 3-15 (recommended: 10+)  
- **Descriptions**: 2-4 (recommended: 4\)  
- **Images**: 1-20 (recommended: 10+)  
- **Logos**: 1-5 (recommended: 3+)  
- **Videos**: Optional but recommended

### Shopping Campaigns

#### Best For

- E-commerce products  
- Visual product catalogs  
- Google Merchant Center integration

#### Structure

Campaign: Shopping \- \[Product Category\]

├── Ad Group: \[Subcategory\]

│   └── Products: \[Product IDs\]

└── Settings:

    \- Bid strategy: Target ROAS

    \- Merchant Center: \[Your account\]

### Discovery Campaigns

#### Best For

- Visual content  
- App promotion  
- Brand awareness  
- Gmail, YouTube, Discover

## Ad Creation

### Responsive Search Ads (RSAs)

#### Headlines (3-15 required, 3 shown)

- **Best practices**:  
  - Include keywords naturally  
  - Highlight unique value propositions  
  - Use numbers and specifics  
  - Create urgency when appropriate  
  - Test different angles

#### Descriptions (2-4 required, 1-2 shown)

- **Best practices**:  
  - Expand on headline benefits  
  - Include call-to-action  
  - Address objections  
  - Use emotional triggers  
  - Keep under 90 characters

#### Pin Headlines/Descriptions

- Pin important headlines to positions 1-3  
- Pin descriptions to positions 1-2  
- Use sparingly (let Google optimize)

### Static Ads (Display/Video)

#### Image Ads

- **Sizes**: 300x250, 728x90, 320x50, etc.  
- **Requirements**:  
  - High-quality images  
  - Clear text overlay  
  - Brand colors  
  - Compelling visuals

#### Video Ads

- **Length**: 6 seconds (bumper) to 3+ minutes  
- **Best practices**:  
  - Hook in first 3 seconds  
  - Clear CTA  
  - Branding throughout  
  - Mobile-optimized  
  - Captions/subtitles

### Ad Testing Framework

#### A/B Testing

Test Structure:

\- Control: Current best-performing ad

\- Variant A: New headline angle

\- Variant B: New description focus

\- Variant C: Different CTA

Metrics to Track:

\- CTR (Click-Through Rate)

\- Conversion Rate

\- CPA (Cost Per Acquisition)

\- ROAS (Return on Ad Spend)

#### Multivariate Testing

- Test multiple elements simultaneously  
- Use statistical significance (95%+)  
- Run for minimum 2 weeks  
- Document learnings

## Extensions

### Sitelink Extensions

#### Best Practices

- **4-6 sitelinks** per campaign  
- **Specific destinations**: Product pages, services  
- **Descriptive text**: 25 characters  
- **Mobile-optimized**: Short, clear text

#### Example Structure

Sitelink 1: "Shop Now" → /products

Sitelink 2: "Free Shipping" → /shipping-info

Sitelink 3: "Customer Reviews" → /reviews

Sitelink 4: "Contact Us" → /contact

### Callout Extensions

#### Best Practices

- **Highlight unique value**: Free shipping, 24/7 support  
- **Address objections**: Money-back guarantee  
- **Create urgency**: Limited time offer  
- **Use 4-6 callouts**: Maximum visibility

### Structured Snippets

#### Categories

- Amenities, Brands, Courses, Degree programs  
- Destinations, Featured hotels, Insurance coverage  
- Models, Neighborhoods, Service catalog, Shows  
- Styles, Types, and more

### Call Extensions

#### Setup

- **Phone number**: Business phone  
- **Call tracking**: Use Google forwarding  
- **Schedule**: Business hours  
- **Text**: "Call now" or custom

### Price Extensions

#### Best For

- Service businesses  
- Product pricing  
- Package deals  
- Tiered offerings

### App Extensions

#### Best For

- Mobile apps  
- App downloads  
- In-app actions

## Audiences & Targeting

### Audience Types

#### Demographics

- **Age**: 18-24, 25-34, 35-44, etc.  
- **Gender**: Male, Female, Unknown  
- **Household income**: Top 10%, 11-20%, etc.  
- **Parental status**: Parent, Non-parent

#### Affinity Audiences

- **Interests**: Sports, Travel, Technology  
- **Lifestyle**: Business professionals, Gamers  
- **Use case**: Brand awareness, broad targeting

#### In-Market Audiences

- **Purchase intent**: Actively researching  
- **Categories**: Auto, Travel, Real Estate  
- **Use case**: Conversion-focused campaigns

#### Custom Audiences

##### Customer Match

Requirements:

\- Email addresses, phone numbers, addresses

\- First name, last name, country

\- Minimum 1,000 matched users

\- Upload via Google Ads interface or API

##### Website Visitors

Setup:

1\. Install Google Ads tag or use GTM

2\. Set up conversion tracking

3\. Create audience in Google Ads

4\. Set membership duration (30-540 days)

##### App Users

Setup:

1\. Link Firebase/Google Analytics

2\. Create audience based on app events

3\. Import to Google Ads

4\. Use for targeting/exclusion

#### Similar Audiences (Lookalikes)

##### Creation

Based on:

\- Customer Match lists

\- Website visitors

\- YouTube users

\- App users

Size: 1-10% of source audience

Refresh: Automatic (weekly)

### Audience Targeting Strategy

#### Funnel-Based Approach

TOFU (Top of Funnel):

\- Affinity audiences

\- Broad demographics

\- Interest-based targeting

MOFU (Middle of Funnel):

\- In-market audiences

\- Website visitors (30-90 days)

\- Video viewers

BOFU (Bottom of Funnel):

\- Customer Match

\- Website converters

\- Cart abandoners

\- Similar audiences

#### Retargeting Setup

Campaign: Display \- Retargeting \- \[Segment\]

Audiences:

\- All Visitors (30 days)

\- Product Viewers (60 days)

\- Cart Abandoners (90 days)

\- Past Purchasers (180 days)

Exclusions:

\- Recent converters (30 days)

\- Current customers

## Bidding Strategies

### Manual CPC

- **Best for**: Testing, control, small budgets  
- **Control**: Full bid control  
- **Optimization**: Manual adjustments

### Target CPA

- **Best for**: Lead generation, consistent CPA goals  
- **Requirements**: 15+ conversions in 30 days  
- **Optimization**: Automatic bid adjustments

### Target ROAS

- **Best for**: E-commerce, revenue goals  
- **Requirements**: 15+ conversions in 30 days  
- **Optimization**: Automatic bid adjustments

### Maximize Conversions

- **Best for**: Maximum conversion volume  
- **Requirements**: Conversion tracking setup  
- **Optimization**: Automatic, no target needed

### Maximize Conversion Value

- **Best for**: Maximum revenue  
- **Requirements**: Value tracking setup  
- **Optimization**: Automatic revenue optimization

### Enhanced CPC (ECPC)

- **Best for**: Manual control with automation  
- **Control**: Manual bids with automatic adjustments  
- **Optimization**: Google adjusts bids up to 30%

### Bid Adjustments

#### Device Adjustments

Desktop: Base bid

Mobile: \+20% (if mobile performs better)

Tablet: \-10% (if tablet underperforms)

#### Location Adjustments

United States: Base bid

United Kingdom: \+15%

Canada: \+10%

Other: \-20%

#### Time Adjustments

Business Hours (9 AM \- 5 PM): \+20%

Evening (6 PM \- 10 PM): \+10%

Night (11 PM \- 8 AM): \-30%

#### Audience Adjustments

High-Value Customers: \+30%

Website Visitors: \+20%

Similar Audiences: \+10%

## Optimization

### Daily Optimization Tasks

#### Performance Review

1. **Check key metrics**:  

   - Impressions, clicks, CTR  
   - Conversions, CPA, ROAS  
   - Quality Score  
   - Search Impression Share



2. **Identify issues**:  

   - Low CTR ads  
   - High CPA keywords  
   - Underperforming ad groups  
   - Budget constraints



3. **Take action**:  

   - Pause underperforming ads  
   - Adjust bids  
   - Add negative keywords  
   - Increase budgets for winners

### Weekly Optimization Tasks

#### Campaign Analysis

1. **Performance comparison**:  

   - Week-over-week trends  
   - Month-over-month trends  
   - Year-over-year (if available)



2. **Segment analysis**:  

   - Device performance  
   - Location performance  
   - Time of day performance  
   - Audience performance



3. **Strategic adjustments**:  

   - Budget reallocation  
   - Bid strategy changes  
   - Audience expansion  
   - Ad creative refresh

### Monthly Optimization Tasks

#### Strategic Review

1. **Campaign structure audit**:  

   - Ad group organization  
   - Keyword relevance  
   - Negative keyword lists  
   - Extension performance



2. **Competitive analysis**:  

   - Auction insights  
   - Impression share trends  
   - Competitor activity



3. **Planning**:  

   - New campaign ideas  
   - Seasonal adjustments  
   - Budget planning  
   - Goal setting

### Quality Score Optimization

#### Factors

- **Expected CTR**: Ad relevance and historical performance  
- **Ad Relevance**: Match between ad and keyword  
- **Landing Page Experience**: Relevance and usability

#### Improvement Strategies

1. **Improve ad relevance**:  

   - Include keywords in ads  
   - Match ad copy to search intent  
   - Use keyword insertion



2. **Optimize landing pages**:  

   - Fast load times  
   - Mobile-friendly  
   - Relevant content  
   - Clear CTAs



3. **Increase CTR**:  

   - Compelling headlines  
   - Strong CTAs  
   - Relevant extensions  
   - Ad testing

## Automation

### Automated Rules

#### Pause Underperforming Ads

Rule Name: Pause Low CTR Ads

Condition: CTR \< 1% AND Impressions \> 1000

Action: Pause ad

Frequency: Daily

#### Increase Budget for Winners

Rule Name: Increase Budget \- High ROAS

Condition: ROAS \> 400% AND Spend \> 80% of budget

Action: Increase budget by 20%

Frequency: Daily

#### Adjust Bids

Rule Name: Lower Bids \- High CPA

Condition: CPA \> Target CPA × 1.5 AND Conversions \> 10

Action: Decrease bids by 10%

Frequency: Daily

### Scripts

#### Pause Low-Performing Keywords

function main() {

  var keywords \= AdsApp.keywords()

    .withCondition('Impressions \> 1000')

    .withCondition('Ctr \< 0.01')

    .withCondition('Conversions \< 1')

    .get();



  while (keywords.hasNext()) {

    var keyword \= keywords.next();

    keyword.pause();

    Logger.log('Paused: ' \+ keyword.getText());

  }

}

#### Daily Performance Report

function main() {

  var report \= AdsApp.report(

    'SELECT CampaignName, Impressions, Clicks, Cost, Conversions, CostPerConversion ' \+

    'FROM CAMPAIGN\_PERFORMANCE\_REPORT ' \+

    'WHERE Date \= YESTERDAY'

  );



  var rows \= report.rows();

  var emailBody \= 'Daily Performance Report\\n\\n';



  while (rows.hasNext()) {

    var row \= rows.next();

    emailBody \+= row\['CampaignName'\] \+ ': ' \+

                 row\['Impressions'\] \+ ' impressions, ' \+

                 row\['Clicks'\] \+ ' clicks, ' \+

                 row\['Cost'\] \+ ' cost\\n';

  }



  MailApp.sendEmail({

    to: 'your-email@example.com',

    subject: 'Daily Google Ads Report',

    body: emailBody

  });

}

### API Integration

#### Common Use Cases

- **Bulk operations**: Upload keywords, ads, campaigns  
- **Reporting**: Automated performance reports  
- **Bid management**: Dynamic bid adjustments  
- **Audience management**: Sync audiences from CRM

#### Authentication

from google.ads.googleads.client import GoogleAdsClient

client \= GoogleAdsClient.load\_from\_storage("google-ads.yaml")

customer\_id \= "1234567890"

\# Example: Get campaign performance

ga\_service \= client.get\_service("GoogleAdsService")

query \= """

    SELECT

      campaign.id,

      campaign.name,

      metrics.impressions,

      metrics.clicks,

      metrics.cost\_micros

    FROM campaign

    WHERE segments.date BETWEEN '2024-01-01' AND '2024-01-31'

"""

response \= ga\_service.search(customer\_id=customer\_id, query=query)

---

**Next Steps**:

- Review [Methodologies](http://../methodologies/optimization.md) for optimization workflows  
- Check [Templates](http://../templates/campaign-blueprints.md) for campaign structures  
- See [Automation Scripts](http://../templates/automation-scripts.md) for more examples

# Google Tag Manager (GTM) Master Guide

## Table of Contents

- [Container Architecture](#container-architecture)  
- [Tags](#tags)  
- [Triggers](#triggers)  
- [Variables](#variables)  
- [Data Layer](#data-layer)  
- [Server-Side Tagging](#server-side-tagging)  
- [Debugging](#debugging)  
- [Best Practices](#best-practices)

## Container Architecture

### Container Structure

Container

├── Workspace (Draft, Version Control)

├── Tags

│   ├── Analytics Tags (GA4, UA, etc.)

│   ├── Marketing Tags (Facebook, LinkedIn, etc.)

│   ├── Utility Tags (Custom HTML, etc.)

│   └── Conversion Tags (Google Ads, etc.)

├── Triggers

│   ├── Page View Triggers

│   ├── Click Triggers

│   ├── Form Triggers

│   ├── Custom Event Triggers

│   └── Timer Triggers

├── Variables

│   ├── Built-in Variables

│   ├── User-Defined Variables

│   ├── Data Layer Variables

│   └── Constant Variables

└── Folders (Organization)

### Naming Conventions (Analytics\_Standards Format)

#### Tags

**Format:** `{Platform} - {Event Type} - {Event Name}`

**Examples:**

- `GA4 - Config - Main`  
- `GA4 - Event - user_click`  
- `GA4 - Event - form_submit`  
- `GA4 - Event - conversion_booking_confirmed`  
- `Facebook - Event - Lead`  
- `Google Ads - Conversion - Lead`

#### Triggers

**Format:** `{Type} - {Event Name} - {Description}`

**Types:**

- `CE` \- Custom Event (from dataLayer)  
- `BIT` \- Built-in Trigger (GTM native)  
- `PV` \- Page View  
- `CL` \- Click  
- `FS` \- Form Submit  
- `SD` \- Scroll Depth  
- `VI` \- Video  
- `EL` \- Element Visibility

**Examples:**

- `CE - user_click - All Clicks`  
- `CE - form_submit - Lead Forms`  
- `CE - conversion_booking_confirmed - All Bookings`  
- `BIT - CL - Button Clicks`  
- `BIT - SD - Scroll Milestones`

#### Variables

**Format:** `{Type} - {Description}`

**Data Layer Variables:**

- `dlv - event` → `event`  
- `dlv - page_path` → `page_path`  
- `dlv - element_type` → `element_type`  
- `dlv - form_id` → `form_id`  
- `dlv - booking_id` → `booking_id`

**Constant Variables:**

- `Constant - GA4 Measurement ID` → Your GA4 ID  
- `Constant - Facebook Pixel ID` → Your FB Pixel ID

### Folder Organization

📁 Analytics

  ├── GA4 Configuration

  ├── GA4 Events

  └── GA4 Conversions

📁 Marketing

  ├── Facebook Pixel

  ├── LinkedIn Insight Tag

  └── Twitter Pixel

📁 Conversion Tracking

  ├── Google Ads

  ├── Microsoft Ads

  └── Other Platforms

📁 Utilities

  ├── Data Layer Helpers

  └── Custom Scripts

## Tags

### GA4 Configuration Tag

#### Basic Setup

Tag Type: Google Analytics: GA4 Configuration

Tag Name: GA4 \- Config \- Main

Measurement ID: G-XXXXXXXXXX

Triggering: All Pages

Fields to Set:

\- user\_id: {{DLV \- User ID}}

\- page\_title: {{Page Title}}

\- page\_location: {{Page URL}}

#### Advanced Configuration

Fields to Set:

\- custom\_map:

  \- dimension1: {{DLV \- User Type}}

  \- dimension2: {{DLV \- Content Category}}

\- send\_page\_view: true

\- cookie\_flags: SameSite=None;Secure

### GA4 Event Tag

#### Purchase Event

Tag Type: Google Analytics: GA4 Event

Tag Name: GA4 \- Event \- Purchase

Configuration Tag: {{GA4 \- Config \- Main}}

Event Name: purchase

Event Parameters:

\- transaction\_id: {{DLV \- Transaction ID}}

\- value: {{DLV \- Transaction Value}}

\- currency: {{DLV \- Currency}}

\- items: {{DLV \- Items Array}}

Trigger: Custom Event \- purchase

#### Custom Event

Tag Type: Google Analytics: GA4 Event

Tag Name: GA4 \- Event \- Video Play

Configuration Tag: {{GA4 \- Config \- Main}}

Event Name: video\_play

Event Parameters:

\- video\_title: {{DLV \- Video Title}}

\- video\_duration: {{DLV \- Video Duration}}

\- video\_percent: {{DLV \- Video Percent}}

Trigger: Custom Event \- video\_play

### Google Ads Conversion Tag

#### Conversion Tracking

Tag Type: Google Ads: Conversion Tracking

Tag Name: Google Ads \- Conversion \- Lead

Conversion ID: AW-XXXXXXXXX

Conversion Label: XxXxXxXxXxX

Conversion Value: {{DLV \- Conversion Value}}

Currency Code: {{DLV \- Currency}}

Trigger: Custom Event \- lead\_submission

### Custom HTML Tags

#### Facebook Pixel Base Code

\<\!-- Facebook Pixel Code \--\>

\<script\>

\!function(f,b,e,v,n,t,s)

{if(f.fbq)return;n=f.fbq=function(){n.callMethod?

n.callMethod.apply(n,arguments):n.queue.push(arguments)};

if(\!f.\_fbq)f.\_fbq=n;n.push=n;n.loaded=\!0;n.version='2.0';

n.queue=\[\];t=b.createElement(e);t.async=\!0;

t.src=v;s=b.getElementsByTagName(e)\[0\];

s.parentNode.insertBefore(t,s)}(window, document,'script',

'https://connect.facebook.net/en\_US/fbevents.js');

fbq('init', '{{Constant \- Facebook Pixel ID}}');

fbq('track', 'PageView');

\</script\>

\<noscript\>

  \<img height="1" width="1" style="display:none"

  src="https://www.facebook.com/tr?id={{Constant \- Facebook Pixel ID}}\&ev=PageView\&noscript=1"/\>

\</noscript\>

#### Data Layer Push Helper

\<script\>

(function() {

  // Push to data layer when element is clicked

  document.querySelectorAll('.track-click').forEach(function(element) {

    element.addEventListener('click', function() {

      window.dataLayer \= window.dataLayer || \[\];

      window.dataLayer.push({

        'event': 'custom\_click',

        'click\_element': this.textContent,

        'click\_location': window.location.pathname

      });

    });

  });

})();

\</script\>

## Triggers

### Page View Triggers

#### All Pages

Trigger Type: Page View

Trigger Name: Page View \- All Pages

This trigger fires on: All Pages

#### Specific Pages

Trigger Type: Page View

Trigger Name: Page View \- Checkout

This trigger fires on: Some Page Views

Conditions:

\- Page Path equals /checkout

\- Page Path contains /checkout/

### Click Triggers

#### All Clicks

Trigger Type: Click \- All Elements

Trigger Name: Click \- All Elements

This trigger fires on: All Elements

#### Specific Element Clicks

Trigger Type: Click \- Just Links

Trigger Name: Click \- CTA Button

This trigger fires on: Some Clicks

Conditions:

\- Click Element matches CSS selector .cta-button

\- OR Click Classes contains cta-primary

#### Outbound Link Clicks

Trigger Type: Click \- Just Links

Trigger Name: Click \- Outbound Links

This trigger fires on: Some Clicks

Conditions:

\- Click URL does not contain {{Page Hostname}}

### Form Triggers

#### Form Submission

Trigger Type: Form Submission

Trigger Name: Form Submit \- Contact Form

This trigger fires on: Some Forms

Conditions:

\- Form ID equals contact-form

\- OR Form Element matches CSS selector \#contact-form

#### Form Start

Trigger Type: Form Start

Trigger Name: Form Start \- Newsletter

This trigger fires on: Some Forms

Conditions:

\- Form ID equals newsletter-signup

### Custom Event Triggers

#### Data Layer Event

Trigger Type: Custom Event

Trigger Name: Custom Event \- Add to Cart

Event name: add\_to\_cart

This trigger fires on: All Custom Events

#### Regex Trigger

Trigger Type: Custom Event

Trigger Name: Custom Event \- Video Events

Event name matches RegEx: ^video\_(start|progress|complete)$

This trigger fires on: All Custom Events

### Timer Triggers

#### Interval Timer

Trigger Type: Timer

Trigger Name: Timer \- 30 Seconds

Interval: 30000 milliseconds

Limit: 1

This trigger fires on: All Pages

#### Event Timer

Trigger Type: Timer

Trigger Name: Timer \- Scroll Depth

Interval: 100 milliseconds

Event Name: scroll\_depth\_check

This trigger fires on: All Pages

## Variables

### Built-in Variables

#### Enable Common Variables

Variables → Configure → Built-in Variables

Enable:

\- Page URL

\- Page Path

\- Page Hostname

\- Referrer

\- Click URL

\- Click Text

\- Form Element

\- Form ID

\- Video Provider

\- Video Status

\- Video URL

\- Video Title

\- Video Duration

\- Video Percent

\- Video Visible

\- Video Current Time

### Data Layer Variables

#### User ID

Variable Type: Data Layer Variable

Variable Name: DLV \- User ID

Data Layer Variable Name: user\_id

Data Type: Text

#### E-commerce Items

Variable Type: Data Layer Variable

Variable Name: DLV \- Items Array

Data Layer Variable Name: ecommerce.items

Data Type: Auto

#### Transaction Value

Variable Type: Data Layer Variable

Variable Name: DLV \- Transaction Value

Data Layer Variable Name: ecommerce.purchase.actionField.revenue

Data Type: Number

### JavaScript Variables

#### Extract Product ID from URL

function() {

  var url \= window.location.pathname;

  var match \= url.match(/\\/(product|item)\\/(\[^\\/\]+)/);

  return match ? match\[2\] : '';

}

#### Get Page Type

function() {

  var path \= window.location.pathname;

  if (path \=== '/') return 'homepage';

  if (path.includes('/product/')) return 'product';

  if (path.includes('/category/')) return 'category';

  if (path.includes('/checkout/')) return 'checkout';

  return 'other';

}

#### Calculate Scroll Depth

function() {

  var scrollPercent \= Math.round(

    ((window.scrollY \+ window.innerHeight) / document.body.scrollHeight) \* 100

  );

  return scrollPercent;

}

### Constant Variables

#### Measurement IDs

Variable Type: Constant

Variable Name: Constant \- GA4 Measurement ID

Value: G-XXXXXXXXXX

#### API Keys

Variable Type: Constant

Variable Name: Constant \- API Key

Value: your-api-key-here

### Regex Table Variables

#### Map Page Types

Variable Type: Regex Table

Variable Name: Regex \- Page Type

Input Variable: {{Page Path}}

Patterns:

\- ^/$ → homepage

\- ^/product/ → product

\- ^/category/ → category

\- .\* → other

#### Extract Campaign Source

Variable Type: Regex Table

Variable Name: Regex \- Campaign Source

Input Variable: {{Page URL}}

Patterns:

\- utm\_source=(\[^&\]+) → $1

\- .\* → direct

## Data Layer

### Data Layer Structure

#### Standard E-commerce Schema

window.dataLayer \= window.dataLayer || \[\];

window.dataLayer.push({

  'event': 'purchase',

  'ecommerce': {

    'transaction\_id': 'T12345',

    'value': 29.99,

    'currency': 'USD',

    'items': \[

      {

        'item\_id': 'SKU123',

        'item\_name': 'Product Name',

        'category': 'Electronics',

        'quantity': 1,

        'price': 29.99

      }

    \]

  },

  'user\_id': 'user123',

  'user\_type': 'premium'

});

#### Custom Event Schema

window.dataLayer.push({

  'event': 'video\_engagement',

  'video\_title': 'Product Demo',

  'video\_duration': 120,

  'video\_percent': 50,

  'content\_category': 'tutorial',

  'content\_type': 'video'

});

### Data Layer Best Practices

#### Initialize Early

\<\!-- Place before GTM container \--\>

\<script\>

window.dataLayer \= window.dataLayer || \[\];

window.dataLayer.push({

  'page\_type': 'homepage',

  'user\_id': '{{user\_id}}',

  'user\_type': '{{user\_type}}'

});

\</script\>

#### Use Consistent Naming

- Use snake\_case for all keys  
- Prefix custom keys (e.g., `custom_parameter`)  
- Document all data layer variables

#### Avoid Conflicts

- Check for existing values before pushing  
- Use namespacing for custom data  
- Clear old values when needed

### Data Layer Helpers

#### Push Helper Function

function pushToDataLayer(data) {

  window.dataLayer \= window.dataLayer || \[\];

  window.dataLayer.push(data);

}

// Usage

pushToDataLayer({

  'event': 'custom\_interaction',

  'interaction\_type': 'button\_click',

  'interaction\_location': 'header'

});

## Server-Side Tagging

### Container Setup

#### Create Server Container

GTM → Admin → Create Container → Server

Container Name: Server Container

Server Container URL: \[Your server URL\]

#### Client Configuration

GTM → Tags → New → Client

Tag Type: Google Analytics: GA4 Client

Tag Name: GA4 Client

Measurement ID: G-XXXXXXXXXX

### Server-Side Benefits

- **Privacy**: First-party data collection  
- **Performance**: Reduced client-side load  
- **Control**: Server-side data processing  
- **Compliance**: Better privacy compliance

### Common Use Cases

- Cookie-less tracking  
- Enhanced privacy compliance  
- Data transformation  
- Multi-platform forwarding

## Debugging

### Preview Mode

#### Using Preview Mode

1. Click "Preview" in GTM  
2. Enter your website URL  
3. Open Debug Console  
4. Navigate your site  
5. Watch tags fire in real-time

#### Debug Console Features

- **Tags**: See which tags fired  
- **Variables**: View variable values  
- **Data Layer**: Monitor data layer pushes  
- **Errors**: Identify tag errors

### Tag Assistant

#### Chrome Extension

1. Install Google Tag Assistant  
2. Navigate to your site  
3. Click extension icon  
4. Review tag firing status  
5. Check for errors

### Common Debugging Scenarios

#### Tag Not Firing

- Check trigger conditions  
- Verify variable values  
- Confirm data layer structure  
- Review browser console for errors

#### Wrong Data Sent

- Validate data layer structure  
- Check variable mappings  
- Verify regex patterns  
- Test with sample data

#### Duplicate Fires

- Check trigger conditions  
- Review tag firing rules  
- Verify data layer pushes  
- Check for multiple containers

## Best Practices

### Performance

1. **Minimize tags**: Only load necessary tags  
2. **Use triggers efficiently**: Avoid overly broad triggers  
3. **Lazy load**: Use timer triggers for non-critical tags  
4. **Cache variables**: Reuse computed values

### Organization

1. **Use folders**: Group related tags/triggers  
2. **Naming conventions**: Follow consistent patterns  
3. **Documentation**: Add notes to complex tags  
4. **Version control**: Use workspaces and versions

### Testing

1. **Preview mode**: Always test before publishing  
2. **Staging environment**: Test in staging first  
3. **Validation**: Verify data in destination platforms  
4. **Rollback plan**: Keep previous versions

### Security

1. **Access control**: Limit admin access  
2. **API keys**: Store in constants, never hardcode  
3. **Data validation**: Validate all inputs  
4. **HTTPS**: Always use secure connections

---

**Next Steps**:

- Review [GA4 Documentation](http://../ga4/README.md) for analytics setup  
- Check [Methodologies](http://../methodologies/implementation.md) for implementation workflows  
- See [Templates](http://../templates/tagging-plans.md) for data layer schemas

# Methodology Guides

## Overview

This section contains comprehensive methodologies for the complete marketing campaign lifecycle, from ideation through closure and iteration.

## Methodology Guides

### 1\. [Ideation & Strategy](http://./ideation-strategy.md)

**Purpose**: Establish the foundation for marketing campaigns through research, segmentation, and strategic planning.

**Key Topics**:

- Research & Discovery  
- Segmentation Strategy  
- KPI Alignment  
- Attribution Modeling  
- Funnel-Based Structuring  
- Competitive Analysis

**When to Use**:

- Starting new campaigns  
- Planning campaign strategy  
- Setting goals and KPIs  
- Analyzing competition

### 2\. [Implementation](http://./implementation.md)

**Purpose**: Transform strategy into actionable tracking and campaigns with proper setup and configuration.

**Key Topics**:

- Pre-Implementation Checklist  
- GTM Tag Deployment  
- GA4 Analytics Setup  
- Campaign Configuration  
- Conversion Tracking  
- Testing & Validation

**When to Use**:

- Setting up new campaigns  
- Implementing tracking  
- Configuring analytics  
- Testing implementations

### 3\. [Optimization](http://./optimization.md)

**Purpose**: Continuously monitor, analyze, and improve campaigns based on data-driven insights.

**Key Topics**:

- Daily Optimization  
- Weekly Reviews  
- Monthly Analysis  
- A/B Testing Framework  
- Budget Reallocation  
- Performance Benchmarks

**When to Use**:

- Ongoing campaign management  
- Performance reviews  
- Optimization planning  
- A/B testing

### 4\. [Maintenance & Scaling](http://./maintenance-scaling.md)

**Purpose**: Ensure long-term campaign health, performance sustainability, and systematic growth.

**Key Topics**:

- Performance Audits  
- Campaign Hygiene  
- Retargeting Optimization  
- Audience Management  
- Automation & Scaling  
- Scaling Strategies

**When to Use**:

- Regular campaign maintenance  
- Scaling successful campaigns  
- Audience management  
- Automation setup

### 5\. [Closure & Iteration](http://./closure-iteration.md)

**Purpose**: Properly wind down campaigns, capture learnings, and plan for future cycles.

**Key Topics**:

- Campaign Wind-Down  
- Attribution Review  
- Data Preservation  
- Learnings Documentation  
- Strategic Recommendations  
- Next Cycle Planning

**When to Use**:

- Ending campaigns  
- Documenting learnings  
- Planning next cycles  
- Strategic reviews

## Methodology Workflow

Ideation & Strategy

        ↓

   Implementation

        ↓

    Optimization

        ↓

Maintenance & Scaling

        ↓

Closure & Iteration

        ↓

  (Back to Ideation)

## Quick Reference

### For New Campaigns

1. Start with [Ideation & Strategy](http://./ideation-strategy.md)  
2. Follow [Implementation](http://./implementation.md)  
3. Begin [Optimization](http://./optimization.md)

### For Existing Campaigns

1. Review [Optimization](http://./optimization.md)  
2. Apply [Maintenance & Scaling](http://./maintenance-scaling.md)  
3. Use [Closure & Iteration](http://./closure-iteration.md) when ending

### For Troubleshooting

- Check [Implementation](http://./implementation.md) for setup issues  
- Review [Optimization](http://./optimization.md) for performance issues  
- See [Troubleshooting Guide](http://../templates/troubleshooting.md)

## Best Practices

### Documentation

- Document all decisions and learnings  
- Maintain campaign logs  
- Update methodologies based on results

### Consistency

- Follow methodologies consistently  
- Use standardized processes  
- Maintain naming conventions

### Continuous Improvement

- Review methodologies regularly  
- Update based on learnings  
- Share best practices

---

**Related Resources**:

- [Campaign Blueprints](http://../templates/campaign-blueprints.md)  
- [Tagging Plans](http://../templates/tagging-plans.md)  
- [Optimization Roadmaps](http://../templates/optimization-roadmaps.md)  
- [Troubleshooting Guide](http://../templates/troubleshooting.md)

# Optimization Methodology

## Overview

The optimization phase involves continuous monitoring, analysis, and improvement of campaigns based on data-driven insights. This methodology ensures systematic performance improvement and ROI maximization.

## Table of Contents

1. [Daily Optimization](#daily-optimization)  
2. [Weekly Reviews](#weekly-reviews)  
3. [Monthly Analysis](#monthly-analysis)  
4. [A/B Testing Framework](#ab-testing-framework)  
5. [Budget Reallocation](#budget-reallocation)  
6. [Performance Benchmarks](#performance-benchmarks)

## Daily Optimization

### Morning Routine (15-30 minutes)

#### Performance Check

1\. Review Previous Day Metrics

   \- Impressions, clicks, CTR

   \- Conversions, CPA, ROAS

   \- Budget utilization

   \- Quality Score changes

2\. Identify Anomalies

   \- Sudden drops in performance

   \- Unexpected spikes

   \- Budget exhaustion

   \- Ad disapprovals

3\. Check Alerts

   \- Automated rule notifications

   \- Budget alerts

   \- Performance alerts

   \- Error notifications

#### Quick Actions

Priority 1: Critical Issues

\- Pause underperforming ads (CTR \< 1%, 1000+ impressions)

\- Increase budgets for winners (ROAS \> 400%, budget exhausted)

\- Fix disapproved ads

\- Resolve tracking issues

Priority 2: Optimization Opportunities

\- Add negative keywords (irrelevant search terms)

\- Adjust bids (high CPA keywords)

\- Pause low-quality keywords

\- Enable new extensions

### Key Metrics Dashboard

#### Campaign-Level Metrics

Primary Metrics:

\- Impressions: Volume of ad views

\- Clicks: Number of clicks

\- CTR: Click-through rate

\- Conversions: Number of conversions

\- CPA: Cost per acquisition

\- ROAS: Return on ad spend

\- Revenue: Total revenue generated

Secondary Metrics:

\- Quality Score: Ad relevance score

\- Impression Share: Market visibility

\- Average Position: Ad ranking

\- Cost: Total spend

#### Ad Group-Level Metrics

Performance Indicators:

\- Ad group performance vs. campaign average

\- Keyword performance within ad group

\- Ad performance within ad group

\- Extension performance

\- Audience performance (if applicable)

### Daily Optimization Actions

#### Keyword Optimization

Pause Keywords:

\- CTR \< 1% AND Impressions \> 1000

\- CPA \> Target CPA × 2 AND Conversions \> 5

\- Quality Score \= 1-3 (after optimization attempts)

Increase Bids:

\- ROAS \> Target ROAS × 1.5

\- Conversion rate \> Campaign average × 1.5

\- Quality Score \= 9-10

Decrease Bids:

\- CPA \> Target CPA × 1.5

\- Conversion rate \< Campaign average × 0.5

\- High impression share but low conversions

#### Ad Optimization

Pause Ads:

\- CTR \< Campaign average × 0.5

\- No conversions after 1000+ impressions

\- Ad relevance issues

Test New Ads:

\- Create variations of top performers

\- Test new headlines/descriptions

\- Test different CTAs

\- Test different value propositions

#### Budget Optimization

Increase Budget:

\- ROAS \> Target ROAS

\- Budget exhausted daily

\- High conversion volume

\- Low CPA

Decrease Budget:

\- ROAS \< Target ROAS × 0.5

\- High CPA

\- Low conversion volume

\- Underutilized budget

## Weekly Reviews

### Weekly Performance Analysis

#### Performance Comparison

Week-over-Week Analysis:

\- Compare current week to previous week

\- Identify trends (improving/declining)

\- Calculate percentage changes

\- Note any significant changes

Month-over-Month Analysis:

\- Compare to same week last month

\- Account for seasonality

\- Identify long-term trends

#### Segment Analysis

##### Device Performance

Desktop:

\- Impressions, clicks, conversions

\- CTR, CPA, ROAS

\- Bid adjustments needed?

Mobile:

\- Impressions, clicks, conversions

\- CTR, CPA, ROAS

\- Mobile-specific optimizations?

Tablet:

\- Impressions, clicks, conversions

\- CTR, CPA, ROAS

\- Tablet-specific optimizations?

##### Location Performance

Top Performing Locations:

\- Identify best locations

\- Increase bids if needed

\- Expand to similar locations

Underperforming Locations:

\- Identify poor locations

\- Decrease bids or exclude

\- Review location-specific factors

##### Time Performance

Best Performing Times:

\- Identify peak hours/days

\- Increase bids during peak times

\- Optimize ad scheduling

Worst Performing Times:

\- Identify low-performing times

\- Decrease bids or pause

\- Review time-specific factors

##### Audience Performance

Audience Analysis:

\- Compare audience performance

\- Identify high-value audiences

\- Exclude low-value audiences

\- Create new audience segments

### Weekly Strategic Actions

#### Campaign Structure Review

Ad Group Organization:

\- Are ad groups properly themed?

\- Are keywords relevant to ad groups?

\- Are ads relevant to keywords?

\- Is structure scalable?

Keyword Organization:

\- Are match types appropriate?

\- Are negative keywords applied?

\- Are keywords properly grouped?

\- Are there keyword conflicts?

#### Extension Performance

Extension Review:

\- Which extensions are performing?

\- Are extensions relevant?

\- Are extensions optimized?

\- Should new extensions be added?

#### Competitive Analysis

Auction Insights:

\- Impression share trends

\- Overlap rate changes

\- Position above rate

\- Top of page rate

Competitive Response:

\- Adjust bids if needed

\- Improve ad quality

\- Enhance extensions

\- Optimize landing pages

## Monthly Analysis

### Comprehensive Performance Review

#### Campaign Performance

Top Performers:

\- Identify best campaigns

\- Analyze success factors

\- Document best practices

\- Plan scaling strategies

Underperformers:

\- Identify poor campaigns

\- Analyze failure factors

\- Determine optimization or pause

\- Document learnings

#### Channel Performance

Channel Comparison:

\- Search vs. Display vs. Video

\- Performance Max vs. Standard campaigns

\- Brand vs. Non-brand campaigns

\- Comparison metrics:

  \- ROAS

  \- CPA

  \- Conversion rate

  \- Revenue

#### Budget Analysis

Budget Allocation:

\- Current budget distribution

\- Performance by budget allocation

\- Optimal budget distribution

\- Budget reallocation recommendations

### Strategic Planning

#### Goal Assessment

KPI Review:

\- Are goals being met?

\- What are the gaps?

\- What adjustments are needed?

\- Are goals realistic?

Forecasting:

\- Project future performance

\- Estimate budget needs

\- Plan for seasonality

\- Set new targets

#### Campaign Planning

New Campaign Ideas:

\- Based on performance data

\- Based on market research

\- Based on business needs

\- Based on competitive analysis

Campaign Expansion:

\- Scale winning campaigns

\- Expand to new markets

\- Test new ad formats

\- Explore new channels

## A/B Testing Framework

### Testing Methodology

#### Test Structure

Hypothesis:

\- Clear hypothesis statement

\- Expected outcome

\- Success metrics

\- Test duration

Test Setup:

\- Control: Current best performer

\- Variant A: New variation

\- Variant B: Alternative variation

\- Sample size: Statistically significant

Test Execution:

\- Run for minimum 2 weeks

\- Ensure equal traffic distribution

\- Monitor daily performance

\- Document observations

#### Testing Elements

##### Ad Creative Testing

Headlines:

\- Test different value propositions

\- Test emotional vs. rational appeals

\- Test urgency vs. benefit-focused

\- Test length variations

Descriptions:

\- Test different CTAs

\- Test benefit-focused vs. feature-focused

\- Test length variations

\- Test tone variations

##### Landing Page Testing

Elements to Test:

\- Headlines

\- CTAs

\- Images

\- Form length

\- Trust signals

\- Social proof

##### Bid Strategy Testing

Strategies to Test:

\- Manual CPC vs. Target CPA

\- Target CPA vs. Target ROAS

\- Maximize Conversions vs. Target CPA

\- Enhanced CPC vs. Manual CPC

### Statistical Significance

#### Sample Size Calculation

Minimum Requirements:

\- 100 conversions per variant

\- 95% confidence level

\- 2-week minimum duration

\- Equal traffic distribution

#### Analysis Framework

Statistical Tests:

\- Chi-square test for conversion rates

\- T-test for continuous metrics

\- Confidence intervals

\- P-value interpretation

Decision Criteria:

\- P-value \< 0.05: Statistically significant

\- Practical significance: Business impact

\- Cost-benefit analysis

\- Risk assessment

## Budget Reallocation

### Budget Optimization Framework

#### Performance-Based Allocation

Allocation Formula:

Budget \= (Performance Score × Base Budget) / Total Performance Score

Performance Score Factors:

\- ROAS (weight: 40%)

\- Conversion Volume (weight: 30%)

\- Growth Potential (weight: 20%)

\- Strategic Importance (weight: 10%)

#### Reallocation Rules

Increase Budget:

\- ROAS \> Target ROAS × 1.2

\- Conversion volume increasing

\- Budget exhausted daily

\- High growth potential

Decrease Budget:

\- ROAS \< Target ROAS × 0.7

\- Conversion volume declining

\- Budget underutilized

\- Low growth potential

Maintain Budget:

\- ROAS within target range

\- Stable performance

\- Strategic importance

### Budget Planning

#### Monthly Budget Planning

1\. Review Previous Month Performance

   \- Actual spend vs. budget

   \- Performance by campaign

   \- ROI by campaign

2\. Forecast Next Month

   \- Expected performance

   \- Seasonal factors

   \- Market conditions

3\. Allocate Budget

   \- High performers: Increase

   \- Low performers: Decrease or pause

   \- New campaigns: Test budget

4\. Set Budget Limits

   \- Daily budgets

   \- Campaign budgets

   \- Account-level limits

## Performance Benchmarks

### Industry Benchmarks

#### Search Campaign Benchmarks

CTR:

\- Top position: 3-5%

\- Position 2-3: 2-3%

\- Position 4+: 1-2%

Conversion Rate:

\- E-commerce: 2-3%

\- Lead generation: 3-5%

\- B2B: 2-4%

CPA:

\- E-commerce: $20-50

\- Lead generation: $30-100

\- B2B: $50-200

#### Display Campaign Benchmarks

CTR:

\- Standard: 0.5-1%

\- Retargeting: 1-2%

Conversion Rate:

\- Standard: 0.5-1%

\- Retargeting: 2-4%

CPA:

\- Standard: $50-150

\- Retargeting: $20-50

### Internal Benchmarks

#### Establishing Baselines

Baseline Metrics:

\- Calculate average performance

\- Identify best performers

\- Set improvement targets

\- Document benchmarks

Benchmark Categories:

\- Campaign-level benchmarks

\- Ad group-level benchmarks

\- Keyword-level benchmarks

\- Audience-level benchmarks

#### Benchmark Tracking

Tracking Framework:

\- Weekly benchmark updates

\- Monthly benchmark reviews

\- Quarterly benchmark assessments

\- Annual benchmark analysis

Improvement Tracking:

\- Performance vs. benchmark

\- Improvement trends

\- Goal achievement

\- Best practice identification

---

**Next Steps**:

- Proceed to [Maintenance & Scaling Methodology](http://./maintenance-scaling.md)  
- Review [Optimization Roadmaps](http://../templates/optimization-roadmaps.md)  
- Check [Performance Review Templates](http://../templates/optimization-roadmaps.md)
