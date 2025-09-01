import React, {useState, useEffect} from 'react';
import {View, Text, Dimensions, TouchableOpacity, FlatList, Image, Alert} from 'react-native';
import {getDBConnection, createTable, dropTable, getItems, insertItem, deleteItens} from '../../base/database.js';
import { check, PERMISSIONS, request, RESULTS } from 'react-native-permissions';
import Geolocation from 'react-native-geolocation-service';
import { TextInput } from 'react-native-paper';

type ResultRequest = {
    next: string,
    results: BodyJsonRequest[];
};

type BodyJsonRequest = {
    url: string,
};

type RequestDetails = {
    id: number,
    name: string,
    sprite: string,
    official_artwork: string,
    base_experience: number,
};

const LoadView = () => {
    const width = Dimensions.get('window').width;
    const height = Dimensions.get('window').height;

    const [data, setData] = useState<RequestDetails[]>([]);
    const [loading, setLoading] = useState(false);
    const [latitude, setLatitude] = useState(0);
    const [longitude, setLongitude] = useState(0);
    const [watchId, setWatchId] = useState(0);

    useEffect(() => {
        (async() => {
            const db = await getDBConnection();

            await createTable(
                db,
                "data",
                `id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                sprite TEXT,
                official_artwork,
                base_experience INTEGER
                `,
            );

            await getData()

            // await deleteItens(db, "data");
        })();
    }, [])

    const loadData = async() => {
        try {
            setLoading(true);
            
            var i = 0;
            var next = "";
            var urlApi = "";

            const db = await getDBConnection();

            while (i < 60) {
                if (next) urlApi = next;
                else urlApi = "https://pokeapi.co/api/v2/pokemon";
                
                const response = await fetch(urlApi)
                const responseData: ResultRequest = await response.json();   

                if (responseData) {
                    next = responseData.next;
                    const promises = responseData.results.map(async (item) => {
                        const res = await fetch(item.url);
                        const resData = await res.json();
                        
                        if (resData.id) {
                            await insertItem(
                                db,
                                "data",
                                [resData.id, resData.name, resData.sprites?.front_default, resData.sprites?.other?.['official-artwork']?.front_default, resData.base_experience],
                                "?,?,?,?,?"
                            )
                        }
                    })

                    await Promise.all(promises);
                };

                i++;
            }

            await getData();            
        }
        catch(err) {
            console.error('Erro em LoadView: ' + JSON.stringify(err))
        }
    }

    const getData = async() => {
        const db = await getDBConnection();
        
        const allData = await getItems(db, "data");
        setData(allData);
        setLoading(false);
    }   

    const resetData = async() => {
        const db = await getDBConnection();

        setData([]);
        await deleteItens(db, "data");
        setLoading(false);
    }

    const onGps = async() => {
        check(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION).then((statuses) => {
            const status = statuses;

            if (status != "granted") {
                request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION)
                    .then((result) =>{
                        Alert.alert("Permissão: " + result)
                    })
            }
            else {
                getPosition()
            }
            console.log('testeStatus: ' + status)

        })            //Checa as permissões de notificação,

    }

    const getPosition = async() => {
        
        const watchId = Geolocation.watchPosition(
                        (position) => {
                            console.log('latitude/longitude: ' + position.coords.latitude + ' / ' + position.coords.longitude)
                            setLatitude(position.coords.latitude);
                            setLongitude(position.coords.longitude);
                        },
                        error => {
                            console.error(error);
                        },

                        {
                            accuracy: {
                                android: "high",
                                ios: "best",
                            },
                            enableHighAccuracy: true, 
                            distanceFilter: 0, 
                            interval: 5000,
                            fastestInterval: 50000,
                            forceLocationManager: false,
                            showLocationDialog: true,
                            useSignificantChanges: false,
                            showsBackgroundLocationIndicator: true,
                        }
        )

        setWatchId(watchId);
        
    }

    const stopGps = () => {
        if (watchId) {
            Geolocation.clearWatch(watchId);
            setLatitude(0);
            setLongitude(0);
            setWatchId(0);
        }
    }

    const renderItem = ({item}: {item: RequestDetails}) => {
        return(
            <View style={{width: width * 0.88, height: height * 0.16, borderRadius: width * 0.02, marginTop: height * 0.02, padding: width * 0.035, display: 'flex', flexDirection: 'row', backgroundColor: '#d5d5d5ff', justifyContent: 'space-between'}}>
                <View style={{display: 'flex', flexDirection: 'column'}}>
                    <Text style={{color: '#252525', fontSize: width * 0.07, textTransform: 'capitalize'}}>{item.id} - {item.name}</Text>
                    <Text style={{color: '#454545ff', fontSize: width * 0.042, textTransform: 'capitalize'}}>Experiência base: {item.base_experience}</Text>
                </View>
                <Image style={{width: width * 0.25, resizeMode: 'cover', height: height * 0.13}} source={{uri: item.official_artwork}}/>
            </View>
        );
    }

    return (
        <View style={{width: width, height: height}}>
            <View style={{width: width, height: height * 0.4, justifyContent: 'center', alignItems: 'center'}}>
                {watchId > 0 ? (
                    <View style={{alignItems: 'center', justifyContent: 'center'}}>
                        <TextInput
                            mode="flat" 
                            label="Coordenadas"
                            value={latitude + ", " + longitude}
                            theme={{ colors: { primary: "#0048FF" } }}
                            disabled={true}
                            style={{width: width * 0.7, height: height * 0.08, backgroundColor: '#fff', marginTop: height * 0.02}}
                        />
                        
                        <TouchableOpacity style={{backgroundColor: '#fff', width: width * 0.53, height: height * 0.075, marginTop: height * 0.02, borderRadius: width * 0.02, alignItems: 'center', justifyContent: 'center', borderWidth: width * 0.006, borderColor: '#009be8ff'}} onPress={() => stopGps()}>
                            <Text style={{fontSize: width * 0.047, color: '#404040ff'}}>Desligar GPS</Text>
                        </TouchableOpacity>
                    </View>
                ):(
                    <TouchableOpacity style={{backgroundColor: '#fff', width: width * 0.53, height: height * 0.075, marginTop: height * 0.02, borderRadius: width * 0.02, alignItems: 'center', justifyContent: 'center', borderWidth: width * 0.006, borderColor: '#009be8ff'}} onPress={() => onGps()}>
                        <Text style={{fontSize: width * 0.047, color: '#404040ff'}}>Ligar GPS</Text>
                    </TouchableOpacity>
                )}
                
                {loading ? (
                    <TouchableOpacity style={{backgroundColor: '#0048FF', width: width * 0.53, height: height * 0.075, borderRadius: width * 0.02, alignItems: 'center', marginTop: height * 0.02, justifyContent: 'center', borderWidth: width * 0.006, borderColor: '#fff'}} onPress={() => loadData()}>
                        <Text style={{fontSize: width * 0.047, color: '#fff'}}>...</Text>
                    </TouchableOpacity>
                ):(
                    <TouchableOpacity style={{backgroundColor: '#fff', width: width * 0.53, height: height * 0.075, borderRadius: width * 0.02, marginTop: height * 0.02, alignItems: 'center', justifyContent: 'center', borderWidth: width * 0.006, borderColor: '#0048FF'}} onPress={() => loadData()}>
                        <Text style={{fontSize: width * 0.047, color: '#404040ff'}}>Carregar dados</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity style={{backgroundColor: '#fff', width: width * 0.53, height: height * 0.075, marginTop: height * 0.02, borderRadius: width * 0.02, alignItems: 'center', justifyContent: 'center', borderWidth: width * 0.006, borderColor: '#000'}} onPress={() => resetData()}>
                    <Text style={{fontSize: width * 0.047, color: '#404040ff'}}>Limpar dados</Text>
                </TouchableOpacity>
            </View>

            <View style={{width: width, flex: 1, height: height, alignItems: 'center', justifyContent: 'center'}}>
                <FlatList
                    data={data}
                    style={{flex: 1, marginBottom: height * 0.05}}
                    keyExtractor={item => item.id.toString()}
                    renderItem={renderItem}
                />
            </View>
        </View>
    )
}

export default LoadView;