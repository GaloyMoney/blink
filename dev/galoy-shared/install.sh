read -p "Make sure you have vendir and docker installed...[Press enter to continue]"
mkdir -p dev/galoy
mkdir -p dev/galoy/galoy
curl -o dev/galoy/vendir.yml https://raw.githubusercontent.com/GaloyMoney/galoy/1015418d59a6d5daae071a2b60324632aa7b4799/dev/galoy-shared/vendir.yml
cd dev/galoy
# todo check if vendir exists
vendir sync # it takes a few seconds to copy from tmp vendir to vendor
sleep 2
cd vendor
chmod +x ./docker/run.sh
./docker/run.sh
sleep 5 # it takes a few seconds for the server to boot
open http://localhost:4002/graphql
echo "install completed successfully! please read docs to create a supergraph here: https://github.com/GaloyMoney/galoy/blob/1015418d59a6d5daae071a2b60324632aa7b4799/dev/galoy-shared/README.md#to-run-a-supergraph-in-your-project "
open https://github.com/GaloyMoney/galoy/blob/1015418d59a6d5daae071a2b60324632aa7b4799/dev/galoy-shared/README.md#to-run-a-supergraph-in-your-project
