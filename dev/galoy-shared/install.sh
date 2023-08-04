read -p "Make sure you have vendir and docker installed...[Press enter to continue]"
mkdir -p dev/galoy
mkdir -p dev/galoy/vendor
cd dev/galoy
curl -o vendir.yml https://raw.githubusercontent.com/GaloyMoney/galoy/45c3153d717a5b80501f2d6ab7747a6319ae0605/dev/galoy-shared/vendir.yml
# todo check if vendir exists
vendir sync
sleep 1 # it takes a second to copy from tmp vendir to vendor
cd vendor
chmod +x ./docker/run.sh
./docker/run.sh
sleep 5 # it takes a few seconds for the server to boot
open http://localhost:4002/graphql
echo "install completed successfully! please read docs to create a supergraph here: https://github.com/GaloyMoney/galoy/blob/45c3153d717a5b80501f2d6ab7747a6319ae0605/dev/galoy-shared/README.md#to-run-a-supergraph-in-your-project"
