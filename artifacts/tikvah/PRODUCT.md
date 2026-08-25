# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- People looking for a calm, private place to express difficult feelings and find appropriate support.
- Tikvah owners and administrators who respond to conversations, manage support content, and maintain the directory of medical and mental-health professionals.

## Product Purpose

Tikvah helps people begin talking about what they are carrying, receive a thoughtful human response, find self-guided resources, and reach professional or emergency support when appropriate. Success means the next helpful action is clear without making a vulnerable person work through a complicated interface.

## Positioning

Tikvah combines a gentle, low-pressure emotional-support experience with clear routes to human, professional, and crisis help. It is a supportive first step, not a replacement for professional or emergency care.

## Operating Context

Visitors may arrive while distressed, uncertain, or short on attention. They browse public support information and resources, while signed-in users can hold private conversations with the Tikvah team. Administrators manage conversations, resources, analytics, and the public professional directory.

## Capabilities and Constraints

- Professional profiles must be stored in the database rather than hard-coded in the frontend.
- Administrators must be able to add, edit, publish, unpublish, order, and remove professional profiles.
- Only published profiles may appear on the public site.
- Public users must not be able to access administrative mutations.
- Emergency support must remain clearly distinct from non-emergency professional help.
- The application uses an OpenAPI-first contract, an Express API, Drizzle ORM, Supabase-hosted Postgres, React Query, and a Vite React frontend.

## Brand Commitments

- Product name: Tikvah.
- Voice: calm, humane, direct, and non-judgmental.
- Avoid clinical coldness, alarmist language, and claims that Tikvah replaces professional care.

## Evidence on Hand

- Existing application copy, routes, authentication, admin tools, and resource-management workflow in this repository.
- No professional profiles, endorsements, verification claims, or practitioner imagery are currently provided and none should be fabricated.

## Product Principles

- Make the safest useful next action obvious.
- Keep administration simple enough for routine maintenance.
- Publish only information deliberately approved by an administrator.
- Preserve privacy and clearly separate support from emergency intervention.
- Prefer forgiving workflows that prevent accidental public changes or data loss.

## Accessibility & Inclusion

Interfaces must remain keyboard accessible, responsive, readable under stress, and understandable without relying on color alone. Contact actions should use descriptive labels and valid telephone, email, and web links.
