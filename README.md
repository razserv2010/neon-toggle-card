# Neon Toggle Card
כרטיס Lovelace בעיצוב ניאון (ON ירוק, OFF אדום/אפור).

## התקנה דרך HACS
- הוסף את הריפו הזה כ-Custom Repository ב-HACS (קטגוריה: Lovelace)
- התקן → HACS ייצור משאב אוטומטי: `/hacsfiles/neon-toggle-card/neon-toggle-card.js`

## שימוש
```yaml
type: custom:neon-toggle-card
entity: switch.example
height: 80
width: 200
animate: true
