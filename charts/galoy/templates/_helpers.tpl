{{- define "galoy.jwtSecret" -}}

{{- $jwtSecret := (lookup "v1" "Secret" .Release.Namespace "jwt-secret") -}}
{{- $valSecret := (coalesce .Values.jwtSecret (genPrivateKey "rsa")) | b64enc -}}
{{- $valRsaSecret := (coalesce .Values.jwtRsaSecret (genPrivateKey "rsa")) | b64enc -}}

{{- if $jwtSecret -}}
  {{- $secret := coalesce $jwtSecret.data.secret $valSecret -}}
  {{- $rsaSecret := coalesce $jwtSecret.data.rsaSecret $valRsaSecret -}}
  {{- /*
      LS0tLS1CRUdJTiBSU0EgUFJJVkFURSBLRVktLS0tLQ = "-----BEGIN RSA PRIVATE KEY-----" | b64enc
  */ -}}
  secret: {{ $secret | quote }}
  {{ if not (hasPrefix "LS0tLS1CRUdJTiBSU0EgUFJJVkFURSBLRVktLS0tLQ" $secret) }}rsaSecret: {{ $rsaSecret | quote }}{{ end }}
{{- else -}}
  secret: {{ $valSecret | quote }}
{{- end -}}

{{- end -}}
