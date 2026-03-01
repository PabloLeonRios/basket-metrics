# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - heading "Iniciar Sesión" [level=1] [ref=e4]
    - generic [ref=e5]:
      - generic [ref=e6]:
        - generic [ref=e7]: Email
        - textbox "Email" [ref=e8]
      - generic [ref=e9]:
        - generic [ref=e10]: Contraseña
        - textbox "Contraseña" [ref=e11]
      - button "Iniciar Sesión" [ref=e13]
    - paragraph [ref=e14]:
      - text: ¿No tienes una cuenta?
      - link "Regístrate" [ref=e15] [cursor=pointer]:
        - /url: /register
  - region "Notifications Alt+T"
  - button "Open Next.js Dev Tools" [ref=e21] [cursor=pointer]:
    - img [ref=e22]
  - alert [ref=e25]
```