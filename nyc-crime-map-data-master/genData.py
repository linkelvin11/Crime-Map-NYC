import csv

# Read in raw data from csv
with open('violent.csv','r',encoding='ascii') as csvfile:
    #csvfile.readline()
    rawData = csv.reader(csvfile, dialect='excel')

    # the template. where data from the csv will be formatted to geojson
    template = \
        ''' \
        { "type" : "Feature",
            "geometry" : {
                "type" : "Point",
                "coordinates" : ["%s","%s"]},
            "properties" : { 
                "YR" : "%s", 
                "MO" : "%s",
                "MAG": "%s"}
            },
        '''

    # the head of the geojson file
    output = \
        ''' \
    { "type" : "Feature Collection",
        {"features" : [
        '''

    # loop through the csv by row skipping the first
    iter = 0
    for row in rawData:
        iter += 1
        if iter >= 2:
            lon = row[1]
            lat = row[0]
            YR = row[2]
            MO = row[3]
            X = row[4]
            Y = row[5]
            TOT = row[6]
            CR = row[7]
            # set crime rating for each crime
            if not(X == "0" and Y == "0"):
                if CR == "FELONY ASSAULT":
                    CR = 1
                elif CR == "ROBBERY":
                    CR = 2
                elif CR == "RAPE":
                    CR = 3
                else:
                    CR = 0
                MAG = int(TOT)*CR
                output += template % (lat,lon,YR,MO,MAG)
            
    # the tail of the geojson file
    output += \
        ''' \
        ]
    }
    }
        '''
        
    # opens an geoJSON file to write the output to
    outFileHandle = open("violent.geojson", "w")
    outFileHandle.write(output)
    outFileHandle.close()
