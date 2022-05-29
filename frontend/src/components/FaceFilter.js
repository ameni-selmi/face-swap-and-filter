import React, { useEffect } from 'react'
import axios from 'axios'
import Box from '@mui/material/Box';
import { useState } from 'react';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import Typography from '@mui/material/Typography';
import {Toaster, toast} from 'react-hot-toast'
import { Fab, Input } from '@mui/material';
export default function FaceFilter() {

  const [index, setIndex] = useState(0)
  const [selectedSrcImage, setSelectedSrcImage] = useState(null);  
  const [selectedDestImage, setSelectedDestImage] = useState(); 
  const [resultImage, setResultImage] = useState(null);  
  const [show, setShow] = useState(true)
  var imgSrc = importAll(require.context('../../public/images', false, /\.(png|jpe?g|svg)$/));
  imgSrc = Object.keys(imgSrc)

  function importAll(r) {
    let images = {};
    r.keys().map((item, index) => { images[item.replace('./', '')] = r(item); });
    return images;
  }
  
  useEffect(()=>{
    fetch('images/'+imgSrc[0])
    .then(res => res.blob())
    .then(image => {
            setSelectedDestImage(image)
        }) 
    .catch(error => {
        console.error(error);
      });    
  }, [])

  const handleNext = ()=>{
    setIndex((index + 1) % imgSrc.length)
    console.log('files=', imgSrc);
      fetch('images/'+imgSrc[index+1])
        .then(res => res.blob())
        .then(image => {
                setSelectedDestImage(image)
                setShow(true)
                handleResult()
            }) 
        .catch(error => {
            console.error(error);
          });    
  }  

  const handleResult = () => {
  const url = 'http://127.0.0.1:5000/img'
  const formData = new FormData()
  formData.append('srcFile', selectedSrcImage)
  formData.append('destFile', selectedDestImage)
  fetch(url, {
  method: "POST",
  body: formData
  })
  .then(res => res.blob())
  .then(image => {
          setResultImage(image)
          console.log('image=', image);
      }) 
  .catch(error => {
      console.error(error);
    }); 
}
  return (
    <>
    <Toaster 
      position="top-right"
      reverseOrder={true}/>
    <Box className='filter-image-container'>
      <div className='upload-container'>
            <label>Paste image here...</label>
            <br/>
            <label id="ext">Only JPG and PNG.</label>
            {selectedSrcImage && (
            <div>
              <img alt="not fount" width={"250px"} src={URL.createObjectURL(selectedSrcImage)} />
            </div>
            )}
            <Stack className='upload_button'>
              <label htmlFor="contained-button-file">
                <Input accept="image/*" id="contained-button-file" multiple type="file" 
                      name="myImage"
                      onChange={(event) => {
                        console.log(event.target.files[0]);
                        setSelectedSrcImage(event.target.files[0]);
              }}  />
                {/* <Button variant="contained"  component="span" style={{backgroundColor: "#EEB902"}}>
                  Upload
                </Button> */}
              </label>
            </Stack>
      </div>  
      <div className='upload-container'>
        <Box style={{'display': 'flex' , 'justifyItems': 'center' , 'marginBottom': '17%'}}>
          <Card className="Card"
                      sx={{ width :"50%", display: 'flex', flexDirection: 'column' , justifyItems: 'center'}}>
              <CardMedia
                  component="img"
                  image={"images/"+ imgSrc[index]}
                  alt="random"
                />
            </Card>
              <Fab size="small" 
                  sx={{
                    bgcolor : "#EEB902", 
                    color : "#fff", 
                  '&:hover': { backgroundColor: '#eeb902d9' ,color: "#fff" }
                  }} 
                    aria-label="add" 
                    style={{'alignSelf' : 'center', 'marginLeft': '15%'}}
              onClick={handleNext} >
              <NavigateNextIcon />
            </Fab>
        </Box>
          <label>OR upload an image here...</label>
          <br/>
          <label id="ext">Only JPG and PNG.</label>
          {selectedDestImage && (
          <div>
            <img hidden={show} alt="not fount" width={"250px"} src={URL.createObjectURL(selectedDestImage)} />
          </div>
          )}
          <div style={{'display': 'flex' , 'justifyItems': 'center' , 'marginBottom': '17%'}} >
          <Stack className='upload_button' >
            <label  htmlFor="contained-button-file">
              <Input  accept="image/*" id="contained-button-file" multiple type="file" 
                    name="myImage"
                    onChange={(event) => {
                      console.log(event.target.files[0]);
                      setSelectedDestImage(event.target.files[0]);
                      setShow(false)
            }}  />
              {/* <Button variant="contained"  component="span" style={{backgroundColor: "#EEB902"}}>
                Upload
              </Button> */}
            </label>
          </Stack>
          <Fab size="small" 
                    sx={{
                      bgcolor : "#EEB902", 
                      color : "#fff", 
                      '&:hover': { backgroundColor: '#eeb902d9' ,color: "#fff" }}} 
                    aria-label="add" 
                    style={{'alignSelf' : 'center', 'marginLeft': '10%'}}
              onClick={handleResult} >
              <NavigateNextIcon />
            </Fab>
          </div>
      </div>
      <div className='upload-container'>
      <label>Result ...</label>
          <br/>
          <label id="ext">isn't that amazing!</label>
          {resultImage && (
          <div>
            <img alt="not fount" width={"250px"} src={URL.createObjectURL(resultImage)} />
          </div>
          )}
      </div>
    </Box>
  </>
  )
}
