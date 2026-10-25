# Layout architecture

```text
body (background image + dark overlay)
└── app shell (max-width: 1115px)
    ├── sticky header (logo · desktop nav · login/profile)
    ├── activity ticker
    ├── main grid (minmax(0, 2fr) / minmax(300px, 1fr))
    │   ├── left column
    │   │   ├── event hero
    │   │   ├── service form (package, quantity, code, note)
    │   │   └── optional project content
    │   └── right column
    │       ├── sticky payment summary
    │       └── security card
    └── footer
```

The existing React route structure stays intact; only the public storefront presentation is brought into this architecture.
