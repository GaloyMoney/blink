{{- define "galoy.jwtSecret" -}}

{{- $secret := (lookup "v1" "Secret" .Release.Namespace "jwt-secret") -}}
{{- if $secret -}}
{{/*
   Reusing current password since secret exists
*/}}
{{-  $secret.data.jwtSecret | b64dec -}}
{{- else if .Values.password -}}
{{ .Values.jwtSecret | b64enc }}
{{- else -}}
{{/*
    Generate new password
*/}}
{{- (randAlpha 24) | b64enc -}}
{{- end -}}
{{- end -}}
